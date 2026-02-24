import { getSymbolSize } from "./utils.js";

export function getRowColCoords(version: number): number[] {
  if (version === 1) return [];

  const posCount = Math.floor(version / 7) + 2;
  const size = getSymbolSize(version);
  const intervals =
    size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
  const positions: number[] = [size - 7];

  for (let i = 1; i < posCount - 1; i++) {
    positions[i] = positions[i - 1] - intervals;
  }

  positions.push(6);

  return positions.reverse();
}

export function getPositions(version: number): number[][] {
  const coords: number[][] = [];
  const pos = getRowColCoords(version);
  const posLength = pos.length;

  for (let i = 0; i < posLength; i++) {
    for (let j = 0; j < posLength; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === posLength - 1) ||
        (i === posLength - 1 && j === 0)
      ) {
        continue;
      }
      coords.push([pos[i], pos[j]]);
    }
  }

  return coords;
}
