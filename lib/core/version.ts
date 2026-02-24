import type { ECLevel } from "../types";
import type { Mode } from "../types";
import * as Utils from "./utils";
import * as ECCode from "./error-correction-code";
import * as ECLevelModule from "./error-correction-level";
import * as ModeModule from "./mode";
import * as VersionCheck from "./version-check";

const G18 =
  (1 << 12) |
  (1 << 11) |
  (1 << 10) |
  (1 << 9) |
  (1 << 8) |
  (1 << 5) |
  (1 << 2) |
  (1 << 0);
const G18_BCH = Utils.getBCHDigit(G18);

export interface SegmentLike {
  mode: Mode;
  getLength: () => number;
  getBitsLength: () => number;
}

function getBestVersionForDataLength(
  mode: Mode,
  length: number,
  errorCorrectionLevel: ECLevel,
): number | undefined {
  for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
    if (length <= getCapacity(currentVersion, errorCorrectionLevel, mode)) {
      return currentVersion;
    }
  }
  return undefined;
}

function getReservedBitsCount(mode: Mode, version: number): number {
  return ModeModule.getCharCountIndicator(mode, version) + 4;
}

function getTotalBitsFromDataArray(
  segments: SegmentLike[],
  version: number,
): number {
  let totalBits = 0;
  for (const data of segments) {
    const reservedBits = getReservedBitsCount(data.mode, version);
    totalBits += reservedBits + data.getBitsLength();
  }
  return totalBits;
}

function getBestVersionForMixedData(
  segments: SegmentLike[],
  errorCorrectionLevel: ECLevel,
): number | undefined {
  for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
    const length = getTotalBitsFromDataArray(segments, currentVersion);
    if (
      length <=
      getCapacity(currentVersion, errorCorrectionLevel, ModeModule.MIXED)
    ) {
      return currentVersion;
    }
  }
  return undefined;
}

export function from(
  value: number | string | undefined,
  defaultValue?: number,
): number | undefined {
  if (VersionCheck.isValid(value as number)) {
    return parseInt(String(value), 10);
  }
  return defaultValue;
}

export function getCapacity(
  version: number,
  errorCorrectionLevel: ECLevel,
  mode?: Mode,
): number {
  if (!VersionCheck.isValid(version)) {
    throw new Error("Invalid QR Code version");
  }

  const modeToUse = mode ?? ModeModule.BYTE;

  const totalCodewords = Utils.getSymbolTotalCodewords(version);
  const ecTotalCodewords = ECCode.getTotalCodewordsCount(
    version,
    errorCorrectionLevel,
  )!;
  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

  if (modeToUse === ModeModule.MIXED) return dataTotalCodewordsBits;

  const usableBits =
    dataTotalCodewordsBits - getReservedBitsCount(modeToUse, version);

  switch (modeToUse) {
    case ModeModule.NUMERIC:
      return Math.floor((usableBits / 10) * 3);
    case ModeModule.ALPHANUMERIC:
      return Math.floor((usableBits / 11) * 2);
    case ModeModule.KANJI:
      return Math.floor(usableBits / 13);
    case ModeModule.BYTE:
    default:
      return Math.floor(usableBits / 8);
  }
}

export function getBestVersionForData(
  data: SegmentLike | SegmentLike[],
  errorCorrectionLevel: ECLevel | string,
): number | undefined {
  const ecl = ECLevelModule.from(
    errorCorrectionLevel as ECLevel,
    ECLevelModule.M,
  );

  if (Array.isArray(data)) {
    if (data.length > 1) {
      return getBestVersionForMixedData(data, ecl);
    }
    if (data.length === 0) {
      return 1;
    }
    return getBestVersionForDataLength(data[0].mode, data[0].getLength(), ecl);
  }

  return getBestVersionForDataLength(data.mode, data.getLength(), ecl);
}

export function getEncodedBits(version: number): number {
  if (!VersionCheck.isValid(version) || version < 7) {
    throw new Error("Invalid QR Code version");
  }

  let d = version << 12;

  while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
    d ^= G18 << (Utils.getBCHDigit(d) - G18_BCH);
  }

  return (version << 12) | d;
}
