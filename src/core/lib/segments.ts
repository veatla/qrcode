import * as Utils from "../../utils/utils";
import * as ECLevel from "../lib/error-correction-level";
import * as ECCode from "../lib/error-correction-code";
import * as Mode from "../lib/mode";
import * as Regex from "../lib/regex";
import * as VersionCheck from "../lib/version-check";
import NumericData from "../datatypes/numeric-data";
import AlphanumericData from "../datatypes/alphanumeric-data";
import KanjiData from "../datatypes/kanji-data";
import ByteData from "../datatypes/byte-data";
import type { DataType } from "../datatypes/type";
import { dijkstra } from "../../utils/dijkstra";

export type RawSegment = {
    data: string;
    index?: number;
    mode: Mode.Mode;
    length: number;
};

/**
 * Returns UTF8 byte length
 *
 * @param  {String} str Input string
 * @return {Number}     Number of byte
 */
export const getStringByteLength = (str: string) => {
    return (unescape || decodeURI)(encodeURIComponent(str)).length;
};

/**
 * Get a list of segments of the specified mode
 * from a string
 *
 * @param  {Mode}   mode Segment mode
 * @param  {String} str  String to process
 * @return {Array}       Array of object with segments data
 */

function getSegments(regex: RegExp, mode: Mode.Mode, str: string) {
    const segments: Array<RawSegment> = [];
    let result;

    while ((result = regex.exec(str)) !== null) {
        segments.push({
            data: result[0],
            index: result.index,
            mode: mode,
            length: result[0].length,
        });
    }

    return segments;
}

/**
 * Extracts a series of segments with the appropriate
 * modes from a string
 *
 * @param  {String} dataStr Input string
 * @return {Array}          Array of object with segments data
 */
function getSegmentsFromString(dataStr: string): Array<RawSegment> {
    const numSegments = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
    const alphaNumSegments: Array<RawSegment> = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
    let byteSegments: Array<RawSegment>;
    let kanjiSegments: Array<RawSegment>;

    if (Utils.isKanjiModeEnabled()) {
        byteSegments = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegments = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
    } else {
        byteSegments = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegments = [];
    }

    const segments = numSegments.concat(alphaNumSegments, byteSegments, kanjiSegments);

    return segments
        .sort((s1, s2) => s1.index! - s2.index!)
        .map((obj, index) => ({
            index,
            data: obj.data,
            mode: obj.mode,
            length: obj.length,
        }));
}

/**
 * Returns how many bits are needed to encode a string of
 * specified length with the specified mode
 *
 * @param  {Number} length String length
 * @param  {Mode} mode     Segment mode
 * @return {Number}        Bit length
 */

function getSegmentBitsLength(length: number, mode: Mode.Mode) {
    switch (mode) {
        case Mode.NUMERIC:
            return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
            return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
            return KanjiData.getBitsLength(length);
        case Mode.BYTE:
            return ByteData.getBitsLength(length);
    }
}

/**
 * Merges adjacent segments which have the same mode
 *
 * @param  {Array} segments Array of object with segments data
 * @return {Array}      Array of object with segments data
 */
function mergeSegments(segments: Array<RawSegment>) {
    return segments.reduce(function (acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
            acc[acc.length - 1]!.data += curr.data;
            return acc;
        }

        acc.push(curr);
        return acc;
    }, [] as Array<RawSegment>);
}

/**
 * Generates a list of all possible nodes combination which
 * will be used to build a segments graph.
 *
 * Nodes are divided by groups. Each group will contain a list of all the modes
 * in which is possible to encode the given text.
 *
 * For example the text '12345' can be encoded as Numeric, Alphanumeric or Byte.
 * The group for '12345' will contain then 3 objects, one for each
 * possible encoding mode.
 *
 * Each node represents a possible segment.
 *
 * @param  {Array} segments Array of object with segments data
 * @return {Array}      Array of object with segments data
 */
function buildNodes(segments: Array<RawSegment>) {
    const nodes: { data: string; mode: Mode.Mode; length: number }[][] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!;

        switch (seg.mode) {
            case Mode.NUMERIC:
                nodes.push([seg, { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length }, { data: seg.data, mode: Mode.BYTE, length: seg.length }]);
                break;
            case Mode.ALPHANUMERIC:
                nodes.push([seg, { data: seg.data, mode: Mode.BYTE, length: seg.length }]);
                break;
            case Mode.KANJI:
                nodes.push([seg, { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }]);
                break;
            case Mode.BYTE:
                nodes.push([{ data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }]);
        }
    }

    return nodes;
}

/**
 * Builds a graph from a list of nodes.
 * All segments in each node group will be connected with all the segments of
 * the next group and so on.
 *
 * At each connection will be assigned a weight depending on the
 * segment's byte length.
 *
 * @param  {Array} nodes    Array of object with segments data
 * @param  {Number} version QR Code version
 * @return {Object}         Graph of all possible segments
 */
function buildGraph(nodes: Array<RawSegment>[], version: number) {
    const table: Record<string, { node: RawSegment; lastCount: number }> = {};
    const graph: Record<string, Record<string, number>> = { start: {} };
    let prevNodeIds = ["start"];

    for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i]!;
        const currentNodeIds = [];

        for (let j = 0; j < nodeGroup.length; j++) {
            const node = nodeGroup[j]!;
            const key = "" + i + j;

            currentNodeIds.push(key);
            table[key] = { node: node, lastCount: 0 };
            graph[key] = {};

            for (let n = 0; n < prevNodeIds.length; n++) {
                const prevNodeId = prevNodeIds[n]!;

                if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
                    graph[prevNodeId]![key] =
                        getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode)! - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode)!;

                    table[prevNodeId].lastCount += node.length;
                } else {
                    if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;

                    graph[prevNodeId]![key] = getSegmentBitsLength(node.length, node.mode)! + 4 + Mode.getCharCountIndicator(node.mode, version); // switch cost
                }
            }
        }

        prevNodeIds = currentNodeIds;
    }

    for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]!]!.end = 0;
    }

    return { map: graph, table: table };
}
/**
 * Builds a segment from a specified data and mode.
 * If a mode is not specified, the more suitable will be used.
 *
 * @param  {String} data             Input data
 * @param  {Mode | String} modesHint Data mode
 * @return {Segment}                 Segment
 */
function buildSingleSegment(data: string, modesHint: Mode.Mode | string | null): DataType {
    let mode;
    const bestMode = Mode.getBestModeForData(data);

    mode = Mode.from(modesHint, bestMode);

    // Make sure data can be encoded
    if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '"' + " cannot be encoded with mode " + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
    }

    // Use Mode.BYTE if Kanji support is disabled
    if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
    }

    switch (mode) {
        case Mode.NUMERIC:
            return new NumericData(data);

        case Mode.ALPHANUMERIC:
            return new AlphanumericData(data);

        case Mode.KANJI:
            return new KanjiData(data);

        case Mode.BYTE:
            return new ByteData(data);

        default:
            throw new Error("Invalid mode");
    }
}

/**
 * Builds a list of segments from an array.
 * Array can contain Strings or Objects with segment's info.
 *
 * For each item which is a string, will be generated a segment with the given
 * string and the more appropriate encoding mode.
 *
 * For each item which is an object, will be generated a segment with the given
 * data and mode.
 * Objects must contain at least the property "data".
 * If property "mode" is not present, the more suitable mode will be used.
 *
 * @param  {Array} array Array of objects with segments data
 * @return {Array}       Array of Segments
 */
export const fromArray = function fromArray(array: RawSegment[]): Array<DataType> {
    return array.reduce(function (acc, seg) {
        if (typeof seg === "string") {
            acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
            acc.push(buildSingleSegment(seg.data, seg.mode));
        }

        return acc;
    }, [] as DataType[]);
};

/**
 * Builds an optimized sequence of segments from a string,
 * which will produce the shortest possible bitstream.
 *
 * @param  {String} data    Input string
 * @param  {Number} version QR Code version
 * @return {Array}          Array of segments
 */
export const fromString = function fromString(data: string, version: number): Array<DataType> {
    const segments = getSegmentsFromString(data);

    const nodes = buildNodes(segments);
    const graph = buildGraph(nodes, version);
    const path = dijkstra.findPath(graph.map, "start", "end");

    const optimizedSegments = [];
    for (let i = 1; i < path.length - 1; i++) {
        optimizedSegments.push(graph.table[path[i]!]!.node);
    }

    return fromArray(mergeSegments(optimizedSegments));
};
/**
 * Splits a string in various segments with the modes which
 * best represent their content.
 * The produced segments are far from being optimized.
 * The output of this function is only used to estimate a QR Code version
 * which may contain the data.
 *
 * @param  {string} data Input string
 * @return {Array}       Array of segments
 */
export const rawSplit = function rawSplit(data: string): Array<DataType> {
    return fromArray(getSegmentsFromString(data));
};
