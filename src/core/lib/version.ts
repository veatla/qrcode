import * as Utils from "../../utils/utils";
import * as ECLevel from "../lib/error-correction-level";
import * as ECCode from "../lib/error-correction-code";
import * as Mode from "../lib/mode";
import * as VersionCheck from "../lib/version-check";
import type { DataType } from "../datatypes/type";

// Generator polynomial used to encode version information
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
const G18_BCH = Utils.getBCHDigit(G18);

function getBestVersionForDataLength(mode: Mode.Mode, length: number, errorCorrectionLevel: ECLevel.ErrorCorrectionType) {
    for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= getCapacity(currentVersion, errorCorrectionLevel, mode)) {
            return currentVersion;
        }
    }

    return undefined;
}

function getReservedBitsCount(mode: Mode.Mode, version: number) {
    // Character count indicator + mode indicator bits
    return Mode.getCharCountIndicator(mode, version) + 4;
}

function getTotalBitsFromDataArray(segments: Array<DataType>, version: number) {
    let totalBits = 0;

    segments.forEach(function (data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
    });

    return totalBits;
}

function getBestVersionForMixedData(segments: Array<DataType>, errorCorrectionLevel: ECLevel.ErrorCorrectionType) {
    for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
            return currentVersion;
        }
    }

    return undefined;
}

/**
 * Returns version number from a value.
 * If value is not a valid version, returns defaultValue
 *
 * @param  {Number|String} value        QR Code version
 * @param  {Number}        defaultValue Fallback value
 * @return {Number}                     QR Code version number
 */
export const from = function from(value: number | string | undefined, defaultValue?: number): number | undefined {
    const _value = parseInt(String(value), 10);
    if (VersionCheck.isValid(_value)) return _value;
    else return defaultValue;
};

/**
 * Returns how much data can be stored with the specified QR code version
 * and error correction level
 *
 * @param  {Number} version              QR Code version (1-40)
 * @param  {Number} errorCorrectionLevel Error correction level
 * @param  {Mode}   mode                 Data mode
 * @return {Number}                      Quantity of storable data
 */
export const getCapacity = function getCapacity(version: number, errorCorrectionLevel: ECLevel.ErrorCorrectionType, mode: Mode.Mode): number {
    if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
    }

    // Use Byte mode as default
    if (typeof mode === "undefined") mode = Mode.BYTE;

    // Total codewords for this QR code version (Data + Error correction)
    const totalCodewords = Utils.getSymbolTotalCodewords(version);

    // Total number of error correction codewords
    const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
    if (!ecTotalCodewords) throw new Error(`Unable to get total codewords count`);
    // Total number of data codewords
    const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

    if (mode === Mode.MIXED) return dataTotalCodewordsBits;

    const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);

    // Return max number of storable codewords
    switch (mode) {
        case Mode.NUMERIC:
            return Math.floor((usableBits / 10) * 3);

        case Mode.ALPHANUMERIC:
            return Math.floor((usableBits / 11) * 2);

        case Mode.KANJI:
            return Math.floor(usableBits / 13);

        case Mode.BYTE:
        default:
            return Math.floor(usableBits / 8);
    }
};

/**
 * Returns the minimum version needed to contain the amount of data
 *
 * @param  {DataType} data                    Segment of data
 * @param  {String} [errorCorrectionLevel=H] Error correction level
 * @param  {Mode} mode                       Data mode
 * @return {Number}                          QR Code version
 */
export const getBestVersionForData = function getBestVersionForData(data: DataType[], errorCorrectionLevel: ECLevel.ErrorCorrectionType): number {
    let seg;

    const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);

    if (Array.isArray(data)) {
        if (data.length > 1) {
            return getBestVersionForMixedData(data, ecl)!;
        }

        if (data.length === 0) {
            return 1;
        }

        seg = data[0];
    } else {
        seg = data;
    }

    return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl)!;
};

/**
 * Returns version information with relative error correction bits
 *
 * The version information is included in QR Code symbols of version 7 or larger.
 * It consists of an 18-bit sequence containing 6 data bits,
 * with 12 error correction bits calculated using the (18, 6) Golay code.
 *
 * @param  {Number} version QR Code version
 * @return {Number}         Encoded version info bits
 */
export const getEncodedBits = function getEncodedBits(version: number): number {
    if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
    }

    let d = version << 12;

    while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << (Utils.getBCHDigit(d) - G18_BCH);
    }

    return (version << 12) | d;
};
