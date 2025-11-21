import type BitBuffer from "../lib/bit-buffer";
import * as Mode from "../lib/mode";
import type { DataType } from "./type";

export default class ByteData implements DataType<NodeJS.NonSharedUint8Array> {
    public mode = Mode.BYTE;
    public data;
    constructor(data: string) {
        if (typeof data === "string") {
            this.data = new TextEncoder().encode(data);
        } else {
            this.data = new Uint8Array(data);
        }
    }

    static getBitsLength(length: number) {
        return length * 8;
    }
    getLength() {
        return this.data.length;
    }

    getBitsLength() {
        return ByteData.getBitsLength(this.data.length);
    }

    write(bitBuffer: BitBuffer) {
        for (let i = 0, l = this.data.length; i < l; i++) {
            bitBuffer.put(this.data[i]!, 8);
        }
    }
}
