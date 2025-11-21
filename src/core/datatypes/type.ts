import type BitBuffer from "../lib/bit-buffer";
import type { Mode } from "../lib/mode";

export interface DataType<T = any> {
    mode: Mode;
    data: T;
    getBitsLength(length: number): number;
    getLength(): number;
    getBitsLength(): number;
    write(bitBuffer: BitBuffer): void;
}
