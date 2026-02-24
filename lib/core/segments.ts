import type { Mode } from "../types";
import * as ModeModule from "./mode.js";
import NumericData from "./numeric-data.js";
import AlphanumericData from "./alphanumeric-data.js";
import ByteData from "./byte-data.js";
import KanjiData from "./kanji-data.js";
import * as Regex from "./regex.js";
import * as Utils from "./utils.js";
import * as dijkstra from "./dijkstrajs.js";

export interface SegmentData {
  data: string;
  mode: Mode;
  length: number;
}

interface SegmentDataWithIndex extends SegmentData {
  index: number;
}

export type Segment = NumericData | AlphanumericData | ByteData | KanjiData;

function getStringByteLength(str: string): number {
  return unescape(encodeURIComponent(str)).length;
}

function getSegments(
  regex: RegExp,
  mode: Mode,
  str: string,
): SegmentDataWithIndex[] {
  const segments: SegmentDataWithIndex[] = [];
  let result: RegExpExecArray | null;

  while ((result = regex.exec(str)) !== null) {
    segments.push({
      data: result[0],
      index: result.index,
      mode,
      length: result[0].length,
    });
  }

  return segments;
}

function getSegmentsFromString(dataStr: string): SegmentData[] {
  const numSegs = getSegments(Regex.NUMERIC, ModeModule.NUMERIC, dataStr);
  const alphaNumSegs = getSegments(
    Regex.ALPHANUMERIC,
    ModeModule.ALPHANUMERIC,
    dataStr,
  );
  let byteSegs: SegmentDataWithIndex[];
  let kanjiSegs: SegmentDataWithIndex[];

  if (Utils.isKanjiModeEnabled()) {
    byteSegs = getSegments(Regex.BYTE, ModeModule.BYTE, dataStr);
    kanjiSegs = getSegments(Regex.KANJI, ModeModule.KANJI, dataStr);
  } else {
    byteSegs = getSegments(Regex.BYTE_KANJI, ModeModule.BYTE, dataStr);
    kanjiSegs = [];
  }

  const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);

  return (segs as SegmentDataWithIndex[])
    .sort((s1, s2) => s1.index - s2.index)
    .map(
      (obj): SegmentData => ({
        data: obj.data,
        mode: obj.mode,
        length: obj.length,
      }),
    );
}

function getSegmentBitsLength(length: number, mode: Mode): number {
  switch (mode) {
    case ModeModule.NUMERIC:
      return NumericData.getBitsLength(length);
    case ModeModule.ALPHANUMERIC:
      return AlphanumericData.getBitsLength(length);
    case ModeModule.KANJI:
      return KanjiData.getBitsLength(length);
    case ModeModule.BYTE:
      return ByteData.getBitsLength(length);
    default:
      return 0;
  }
}

function mergeSegments(segs: SegmentData[]): SegmentData[] {
  return segs.reduce<SegmentData[]>((acc, curr) => {
    const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
    if (prevSeg && prevSeg.mode === curr.mode) {
      acc[acc.length - 1] = { ...prevSeg, data: prevSeg.data + curr.data };
      return acc;
    }
    acc.push(curr);
    return acc;
  }, []);
}

function buildNodes(segs: SegmentData[]): SegmentData[][] {
  const nodes: SegmentData[][] = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];

    switch (seg.mode) {
      case ModeModule.NUMERIC:
        nodes.push([
          seg,
          { data: seg.data, mode: ModeModule.ALPHANUMERIC, length: seg.length },
          { data: seg.data, mode: ModeModule.BYTE, length: seg.length },
        ]);
        break;
      case ModeModule.ALPHANUMERIC:
        nodes.push([
          seg,
          { data: seg.data, mode: ModeModule.BYTE, length: seg.length },
        ]);
        break;
      case ModeModule.KANJI:
        nodes.push([
          seg,
          {
            data: seg.data,
            mode: ModeModule.BYTE,
            length: getStringByteLength(seg.data),
          },
        ]);
        break;
      case ModeModule.BYTE:
        nodes.push([
          {
            data: seg.data,
            mode: ModeModule.BYTE,
            length: getStringByteLength(seg.data),
          },
        ]);
    }
  }

  return nodes;
}

interface GraphTable {
  [key: string]: { node: SegmentData; lastCount: number };
}

function buildGraph(
  nodes: SegmentData[][],
  version: number,
): { map: Record<string, Record<string, number>>; table: GraphTable } {
  const table: GraphTable = {};
  const graph: Record<string, Record<string, number>> = { start: {} };
  let prevNodeIds = ["start"];

  for (let i = 0; i < nodes.length; i++) {
    const nodeGroup = nodes[i];
    const currentNodeIds: string[] = [];

    for (let j = 0; j < nodeGroup.length; j++) {
      const node = nodeGroup[j];
      const key = "" + i + j;

      currentNodeIds.push(key);
      table[key] = { node, lastCount: 0 };
      graph[key] = {};

      for (let n = 0; n < prevNodeIds.length; n++) {
        const prevNodeId = prevNodeIds[n];

        if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
          graph[prevNodeId][key] =
            getSegmentBitsLength(
              table[prevNodeId].lastCount + node.length,
              node.mode,
            ) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);

          table[prevNodeId].lastCount += node.length;
        } else {
          if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;

          graph[prevNodeId][key] =
            getSegmentBitsLength(node.length, node.mode) +
            4 +
            ModeModule.getCharCountIndicator(node.mode, version);
        }
      }
    }

    prevNodeIds = currentNodeIds;
  }

  for (let n = 0; n < prevNodeIds.length; n++) {
    graph[prevNodeIds[n]].end = 0;
  }

  return { map: graph, table };
}

function buildSingleSegment(
  data: string,
  modesHint: Mode | string | null | undefined,
): Segment {
  const bestMode = ModeModule.getBestModeForData(data);
  let mode = ModeModule.from(modesHint ?? undefined, bestMode);

  if (mode !== ModeModule.BYTE && mode.bit < bestMode.bit) {
    throw new Error(
      '"' +
        data +
        '"' +
        " cannot be encoded with mode " +
        ModeModule.toString(mode) +
        ".\n Suggested mode is: " +
        ModeModule.toString(bestMode),
    );
  }

  if (mode === ModeModule.KANJI && !Utils.isKanjiModeEnabled()) {
    mode = ModeModule.BYTE;
  }

  switch (mode) {
    case ModeModule.NUMERIC:
      return new NumericData(data);
    case ModeModule.ALPHANUMERIC:
      return new AlphanumericData(data);
    case ModeModule.KANJI:
      return new KanjiData(data);
    case ModeModule.BYTE:
    default:
      return new ByteData(data);
  }
}

export function fromArray(
  array: Array<string | { data: string; mode?: Mode | string }>,
): Segment[] {
  return array.reduce<Segment[]>((acc, seg) => {
    if (typeof seg === "string") {
      acc.push(buildSingleSegment(seg, null));
    } else if (seg.data) {
      acc.push(buildSingleSegment(seg.data, seg.mode));
    }
    return acc;
  }, []);
}

export function fromString(data: string, version: number): Segment[] {
  const segs = getSegmentsFromString(data);

  const nodes = buildNodes(segs);
  const graph = buildGraph(nodes, version);
  const path = dijkstra.findPath(graph.map, "start", "end");

  const optimizedSegs: SegmentData[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    optimizedSegs.push(graph.table[path[i]].node);
  }

  return fromArray(mergeSegments(optimizedSegs));
}

export function rawSplit(data: string): Segment[] {
  return fromArray(getSegmentsFromString(data));
}
