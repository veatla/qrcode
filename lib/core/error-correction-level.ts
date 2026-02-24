import type { ECLevel } from "../types";

export const L: ECLevel = { bit: 1 };
export const M: ECLevel = { bit: 0 };
export const Q: ECLevel = { bit: 3 };
export const H: ECLevel = { bit: 2 };

function fromString(string: string): ECLevel {
  if (typeof string !== "string") {
    throw new Error("Param is not a string");
  }

  const lcStr = string.toLowerCase();

  switch (lcStr) {
    case "l":
    case "low":
      return L;

    case "m":
    case "medium":
      return M;

    case "q":
    case "quartile":
      return Q;

    case "h":
    case "high":
      return H;

    default:
      throw new Error("Unknown EC Level: " + string);
  }
}

export function isValid(level: ECLevel): boolean {
  return !!(
    level &&
    typeof level.bit !== "undefined" &&
    level.bit >= 0 &&
    level.bit < 4
  );
}

export function from(
  value: ECLevel | string | undefined,
  defaultValue: ECLevel,
): ECLevel {
  if (value !== undefined && isValid(value as ECLevel)) {
    return value as ECLevel;
  }

  try {
    return fromString(value as string);
  } catch {
    return defaultValue;
  }
}
