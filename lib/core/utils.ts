let toSJISFunction: ((codePoint: number) => number) | undefined;

const CODEWORDS_COUNT = [
  0, // Not used
  26,
  44,
  70,
  100,
  134,
  172,
  196,
  242,
  292,
  346,
  404,
  466,
  532,
  581,
  655,
  733,
  815,
  901,
  991,
  1085,
  1156,
  1258,
  1364,
  1474,
  1588,
  1706,
  1828,
  1921,
  2051,
  2185,
  2323,
  2465,
  2611,
  2761,
  2876,
  3034,
  3196,
  3362,
  3532,
  3706,
];

export function getSymbolSize(version: number): number {
  if (!version) throw new Error('"version" cannot be null or undefined');
  if (version < 1 || version > 40)
    throw new Error('"version" should be in range from 1 to 40');
  return version * 4 + 17;
}

export function getSymbolTotalCodewords(version: number): number {
  return CODEWORDS_COUNT[version];
}

export function getBCHDigit(data: number): number {
  let digit = 0;
  let d = data;
  while (d !== 0) {
    digit++;
    d >>>= 1;
  }
  return digit;
}

export function setToSJISFunction(f: (codePoint: number) => number): void {
  if (typeof f !== "function") {
    throw new Error('"toSJISFunc" is not a valid function.');
  }
  toSJISFunction = f;
}

export function isKanjiModeEnabled(): boolean {
  return typeof toSJISFunction !== "undefined";
}

export function toSJIS(kanji: number): number {
  if (!toSJISFunction) throw new Error("toSJIS function is not set");
  return toSJISFunction(kanji);
}
