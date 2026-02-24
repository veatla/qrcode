import type { ECLevel } from "../types";
import type { QRCodeOptions } from "../types";
import * as Utils from "./utils.js";
import * as ECLevelModule from "./error-correction-level.js";
import BitBuffer from "./bit-buffer.js";
import BitMatrix from "./bit-matrix.js";
import * as AlignmentPattern from "./alignment-pattern.js";
import * as FinderPattern from "./finder-pattern.js";
import * as MaskPattern from "./mask-pattern.js";
import * as ECCode from "./error-correction-code.js";
import ReedSolomonEncoder from "./reed-solomon-encoder.js";
import * as Version from "./version.js";
import * as FormatInfo from "./format-info.js";
import * as Mode from "./mode.js";
import * as Segments from "./segments.js";
import type { Segment } from "./segments";

export interface QRCodeCreateResult {
  modules: BitMatrix;
  version: number;
  errorCorrectionLevel: ECLevel;
  maskPattern: number;
  segments: Segment[];
}

function setupFinderPattern(matrix: BitMatrix, version: number): void {
  const size = matrix.size;
  const pos = FinderPattern.getPositions(version);

  for (let i = 0; i < pos.length; i++) {
    const row = pos[i][0];
    const col = pos[i][1];

    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || size <= row + r) continue;

      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || size <= col + c) continue;

        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix.set(row + r, col + c, true, true);
        } else {
          matrix.set(row + r, col + c, false, true);
        }
      }
    }
  }
}

function setupTimingPattern(matrix: BitMatrix): void {
  const size = matrix.size;

  for (let r = 8; r < size - 8; r++) {
    const value = r % 2 === 0;
    matrix.set(r, 6, value, true);
    matrix.set(6, r, value, true);
  }
}

function setupAlignmentPattern(matrix: BitMatrix, version: number): void {
  const pos = AlignmentPattern.getPositions(version);

  for (let i = 0; i < pos.length; i++) {
    const row = pos[i][0];
    const col = pos[i][1];

    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (
          r === -2 ||
          r === 2 ||
          c === -2 ||
          c === 2 ||
          (r === 0 && c === 0)
        ) {
          matrix.set(row + r, col + c, true, true);
        } else {
          matrix.set(row + r, col + c, false, true);
        }
      }
    }
  }
}

function setupVersionInfo(matrix: BitMatrix, version: number): void {
  const size = matrix.size;
  const bits = Version.getEncodedBits(version);

  for (let i = 0; i < 18; i++) {
    const row = Math.floor(i / 3);
    const col = (i % 3) + size - 8 - 3;
    const mod = ((bits >> i) & 1) === 1;

    matrix.set(row, col, mod, true);
    matrix.set(col, row, mod, true);
  }
}

function setupFormatInfo(
  matrix: BitMatrix,
  errorCorrectionLevel: ECLevel,
  maskPattern: number,
): void {
  const size = matrix.size;
  const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);

  for (let i = 0; i < 15; i++) {
    const mod = ((bits >> i) & 1) === 1;

    if (i < 6) {
      matrix.set(i, 8, mod, true);
    } else if (i < 8) {
      matrix.set(i + 1, 8, mod, true);
    } else {
      matrix.set(size - 15 + i, 8, mod, true);
    }

    if (i < 8) {
      matrix.set(8, size - i - 1, mod, true);
    } else if (i < 9) {
      matrix.set(8, 15 - i - 1 + 1, mod, true);
    } else {
      matrix.set(8, 15 - i - 1, mod, true);
    }
  }

  matrix.set(size - 8, 8, 1, true);
}

function setupData(matrix: BitMatrix, data: Uint8Array): void {
  const size = matrix.size;
  let inc = -1;
  let row = size - 1;
  let bitIndex = 7;
  let byteIndex = 0;

  for (let col = size - 1; col > 0; col -= 2) {
    let cCol = col;
    if (cCol === 6) cCol--;

    while (true) {
      for (let c = 0; c < 2; c++) {
        if (!matrix.isReserved(row, cCol - c)) {
          let dark = false;

          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
          }

          matrix.set(row, cCol - c, dark);
          bitIndex--;

          if (bitIndex === -1) {
            byteIndex++;
            bitIndex = 7;
          }
        }
      }

      row += inc;

      if (row < 0 || size <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
}

function createData(
  version: number,
  errorCorrectionLevel: ECLevel,
  segments: Segment[],
): Uint8Array {
  const buffer = new BitBuffer();

  for (const data of segments) {
    buffer.put(data.mode.bit, 4);
    buffer.put(
      data.getLength(),
      Mode.getCharCountIndicator(data.mode, version),
    );
    data.write(buffer);
  }

  const totalCodewords = Utils.getSymbolTotalCodewords(version);
  const ecTotalCodewords = ECCode.getTotalCodewordsCount(
    version,
    errorCorrectionLevel,
  )!;
  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

  if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
    buffer.put(0, 4);
  }

  while (buffer.getLengthInBits() % 8 !== 0) {
    buffer.putBit(false);
  }

  const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
  for (let i = 0; i < remainingByte; i++) {
    buffer.put(i % 2 ? 0x11 : 0xec, 8);
  }

  return createCodewords(buffer, version, errorCorrectionLevel);
}

function createCodewords(
  bitBuffer: BitBuffer,
  version: number,
  errorCorrectionLevel: ECLevel,
): Uint8Array {
  const totalCodewords = Utils.getSymbolTotalCodewords(version);
  const ecTotalCodewords = ECCode.getTotalCodewordsCount(
    version,
    errorCorrectionLevel,
  )!;
  const dataTotalCodewords = totalCodewords - ecTotalCodewords;
  const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel)!;
  const blocksInGroup2 = totalCodewords % ecTotalBlocks;
  const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
  const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
  const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
  const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
  const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;

  const rs = new ReedSolomonEncoder(ecCount);

  let offset = 0;
  const dcData: Uint8Array[] = [];
  const ecData: Uint8Array[] = [];
  let maxDataSize = 0;
  const buffer = new Uint8Array(bitBuffer.buffer);

  for (let b = 0; b < ecTotalBlocks; b++) {
    const dataSize =
      b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
    dcData[b] = buffer.slice(offset, offset + dataSize);
    ecData[b] = rs.encode(dcData[b]);
    offset += dataSize;
    maxDataSize = Math.max(maxDataSize, dataSize);
  }

  const data = new Uint8Array(totalCodewords);
  let index = 0;

  for (let i = 0; i < maxDataSize; i++) {
    for (let r = 0; r < ecTotalBlocks; r++) {
      if (i < dcData[r].length) {
        data[index++] = dcData[r][i];
      }
    }
  }

  for (let i = 0; i < ecCount; i++) {
    for (let r = 0; r < ecTotalBlocks; r++) {
      data[index++] = ecData[r][i];
    }
  }

  return data;
}

function createSymbol(
  data: string | Array<string | { data: string; mode?: string }>,
  version: number | undefined,
  errorCorrectionLevel: ECLevel,
  maskPattern: number | undefined,
): QRCodeCreateResult {
  let segments: Segment[];

  if (Array.isArray(data)) {
    segments = Segments.fromArray(data);
  } else if (typeof data === "string") {
    let estimatedVersion = version;

    if (!estimatedVersion) {
      const rawSegments = Segments.rawSplit(data);
      estimatedVersion = Version.getBestVersionForData(
        rawSegments,
        errorCorrectionLevel,
      );
    }

    segments = Segments.fromString(data, estimatedVersion || 40);
  } else {
    throw new Error("Invalid data");
  }

  const bestVersion = Version.getBestVersionForData(
    segments,
    errorCorrectionLevel,
  );

  if (!bestVersion) {
    throw new Error("The amount of data is too big to be stored in a QR Code");
  }

  if (!version) {
    version = bestVersion;
  } else if (version < bestVersion) {
    throw new Error(
      "\n" +
        "The chosen QR Code version cannot contain this amount of data.\n" +
        "Minimum version required to store current data is: " +
        bestVersion +
        ".\n",
    );
  }

  const dataBits = createData(version, errorCorrectionLevel, segments);

  const moduleCount = Utils.getSymbolSize(version);
  const modules = new BitMatrix(moduleCount);

  setupFinderPattern(modules, version);
  setupTimingPattern(modules);
  setupAlignmentPattern(modules, version);
  setupFormatInfo(modules, errorCorrectionLevel, 0);

  if (version >= 7) {
    setupVersionInfo(modules, version);
  }

  setupData(modules, dataBits);

  if (maskPattern === undefined || isNaN(maskPattern)) {
    maskPattern = MaskPattern.getBestMask(
      modules,
      setupFormatInfo.bind(null, modules, errorCorrectionLevel),
    );
  }

  MaskPattern.applyMask(maskPattern, modules);
  setupFormatInfo(modules, errorCorrectionLevel, maskPattern);

  return {
    modules,
    version,
    errorCorrectionLevel,
    maskPattern,
    segments,
  };
}

export function create(
  data: string | Array<string | { data: string; mode?: string }>,
  options?: QRCodeOptions,
): QRCodeCreateResult {
  if (typeof data === "undefined" || data === "") {
    throw new Error("No input text");
  }

  let errorCorrectionLevel: ECLevel = ECLevelModule.M;
  let version: number | undefined;
  let mask: number | undefined;

  if (typeof options !== "undefined") {
    errorCorrectionLevel = ECLevelModule.from(
      options.errorCorrectionLevel,
      ECLevelModule.M,
    );
    version = Version.from(options.version);
    mask = MaskPattern.from(options.maskPattern);

    if (options.toSJISFunc) {
      Utils.setToSJISFunction(options.toSJISFunc);
    }
  }

  return createSymbol(data, version, errorCorrectionLevel, mask);
}
