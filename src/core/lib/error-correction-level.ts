export type ErrorCorrectionType = {
    bit: number;
};

export const M = { bit: 0 };
export const L = { bit: 1 };
export const Q = { bit: 2 };
export const H = { bit: 3 };

export function fromString(str: string) {
    if (typeof str !== "string") throw new Error(`Param is not string`);

    const lowercased = str.toLocaleLowerCase();

    switch (lowercased) {
        case "low":
            return L;
        case "l":
            return L;

        case "m":
            return M;
        case "medium":
            return M;

        case "q":
            return Q;
        case "quartile":
            return Q;

        case "h":
            return H;
        case "high":
            return H;

        default:
            throw new Error("Unknown EC Level: " + str);
    }
}

export const isValid = function isValid(level: ErrorCorrectionType) {
    return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
};

export const from = function from(value: ErrorCorrectionType | string | undefined, defaultValue: ErrorCorrectionType) {
    if (typeof value !== "string" && value && isValid(value)) return value;
    try {
        if (typeof value === "string") return fromString(value);
        else return defaultValue;
    } catch (e) {
        return defaultValue;
    }
};
