import type BitBuffer from "../lib/bit-buffer";
import * as Mode from "../lib/mode";
import type { DataType } from "./type";

export default class NumericData implements DataType<string> {
    public mode = Mode.NUMERIC;
    public data: string;
    constructor(data: number | string) {
        this.data = data.toString();
    }

    static getBitsLength(length: number) {
        return 10 * Math.floor(length / 3) + (length % 3 ? (length % 3) * 3 + 1 : 0);
    }
    getLength() {
        return this.data.length;
    }

    getBitsLength() {
        return NumericData.getBitsLength(this.data.length);
    }

    write(bitBuffer: BitBuffer) {
        let i, group, value;

        // The input data string is divided into groups of three digits,
        // and each group is converted to its 10-bit binary equivalent.
        for (i = 0; i + 3 <= this.data.length; i += 3) {
            group = this.data.substr(i, 3);
            value = parseInt(group, 10);

            bitBuffer.put(value, 10);
        }

        // If the number of input digits is not an exact multiple of three,
        // the final one or two digits are converted to 4 or 7 bits respectively.
        const remainingNum = this.data.length - i;
        if (remainingNum > 0) {
            group = this.data.substr(i);
            value = parseInt(group, 10);

            bitBuffer.put(value, remainingNum * 3 + 1);
        }
    }
}
