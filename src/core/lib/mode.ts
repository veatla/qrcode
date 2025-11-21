import * as VersionCheck from "./version-check";
import * as Regex from "./regex";

export type Mode = {
    id: string;
    bit: number;
    ccBits: number[];
};

/**
 * Numeric mode encodes data from the decimal digit set (0 - 9)
 * (byte values 30HEX to 39HEX).
 * Normally, 3 data characters are represented by 10 bits.
 *
 * @type {Mode}
 */
export const NUMERIC: Mode = {
    id: "Numeric",
    bit: 1 << 0,
    ccBits: [10, 12, 14],
};

/**
 * Alphanumeric mode encodes data from a set of 45 characters,
 * i.e. 10 numeric digits (0 - 9),
 *      26 alphabetic characters (A - Z),
 *   and 9 symbols (SP, $, %, *, +, -, ., /, :).
 * Normally, two input characters are represented by 11 bits.
 *
 * @type {Mode}
 */
export const ALPHANUMERIC: Mode = {
    id: "Alphanumeric",
    bit: 1 << 1,
    ccBits: [9, 11, 13],
};

/**
 * In byte mode, data is encoded at 8 bits per character.
 *
 * @type {Mode}
 */
export const BYTE: Mode = {
    id: "Byte",
    bit: 1 << 2,
    ccBits: [8, 16, 16],
};

/**
 * The Kanji mode efficiently encodes Kanji characters in accordance with
 * the Shift JIS system based on JIS X 0208.
 * The Shift JIS values are shifted from the JIS X 0208 values.
 * JIS X 0208 gives details of the shift coded representation.
 * Each two-byte character value is compacted to a 13-bit binary codeword.
 *
 * @type {Mode}
 */
export const KANJI: Mode = {
    id: "Kanji",
    bit: 1 << 3,
    ccBits: [8, 10, 12],
};

/**
 * Mixed mode will contain a sequences of data in a combination of any of
 * the modes described above
 *
 * @type {Mode}
 */
export const MIXED: Mode = {
    id: "Mixed",
    bit: -1,
    ccBits: [],
};

/**
 * Returns the number of bits needed to store the data length
 * according to QR Code specifications.
 *
 * @param  {Mode}   mode    Data mode
 * @param  {Number} version QR Code version
 * @return {Number}         Number of bits
 */
export const getCharCountIndicator = function getCharCountIndicator(mode: Mode, version: number): number {
    if (!mode.ccBits) throw new Error("Invalid mode: " + mode);

    if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
    }

    if (version >= 1 && version < 10) return mode.ccBits[0];
    else if (version < 27) return mode.ccBits[1];
    return mode.ccBits[2];
};

/**
 * Returns the most efficient mode to store the specified data
 *
 * @param  {String} dataStr Input data string
 * @return {Mode}           Best mode
 */
export const getBestModeForData = function getBestModeForData(dataStr: string) {
    if (Regex.testNumeric(dataStr)) return NUMERIC;
    else if (Regex.testAlphanumeric(dataStr)) return ALPHANUMERIC;
    else if (Regex.testKanji(dataStr)) return KANJI;
    else return BYTE;
};

/**
 * Return mode name as string
 *
 * @param {Mode} mode Mode object
 * @returns {String}  Mode name
 */
export const toString = function toString(mode: Mode) {
    if (mode && mode.id) return mode.id;
    throw new Error("Invalid mode");
};

/**
 * Check if input param is a valid mode object
 *
 * @param   {Mode}    mode Mode object
 * @returns {Boolean} True if valid mode, false otherwise
 */
export const isValid = function isValid(mode: Mode): boolean {
    return Boolean(mode && mode.bit && mode.ccBits);
};

/**
 * Get mode object from its name
 *
 * @param   {String} string Mode name
 * @returns {Mode}          Mode object
 */
function fromString(string: string): Mode {
    if (typeof string !== "string") {
        throw new Error("Param is not a string");
    }

    const lcStr = string.toLowerCase();

    switch (lcStr) {
        case "numeric":
            return NUMERIC;
        case "alphanumeric":
            return ALPHANUMERIC;
        case "kanji":
            return KANJI;
        case "byte":
            return BYTE;
        default:
            throw new Error("Unknown mode: " + string);
    }
}

/**
 * Returns mode from a value.
 * If value is not a valid mode, returns defaultValue
 *
 * @param  {Mode|String} value        Encoding mode
 * @param  {Mode}        defaultValue Fallback value
 * @return {Mode}                     Encoding mode
 */
export const from = function from(value: Mode | string | null, defaultValue: Mode): Mode {
    if (typeof value !== "string" && value && isValid(value)) return value;

    try {
        if (typeof value === "string") return fromString(value);
        else return defaultValue;
    } catch (e) {
        return defaultValue;
    }
};
