import { getSymbolSize } from "./utils.js";

const FINDER_PATTERN_SIZE = 7;

export function getPositions(version: number): number[][] {
  const size = getSymbolSize(version);

  return [
    [0, 0],
    [size - FINDER_PATTERN_SIZE, 0],
    [0, size - FINDER_PATTERN_SIZE],
  ];
}
