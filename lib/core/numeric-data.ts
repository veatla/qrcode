import type BitBuffer from "./bit-buffer";
import { NUMERIC } from "./mode";

export default class NumericData {
  mode = NUMERIC;
  data: string;

  constructor(data: string | number) {
    this.data = data.toString();
  }

  static getBitsLength(length: number): number {
    return (
      10 * Math.floor(length / 3) + (length % 3 ? (length % 3) * 3 + 1 : 0)
    );
  }

  getLength(): number {
    return this.data.length;
  }

  getBitsLength(): number {
    return NumericData.getBitsLength(this.data.length);
  }

  write(bitBuffer: BitBuffer): void {
    let i = 0;
    for (; i + 3 <= this.data.length; i += 3) {
      const group = this.data.substring(i, i + 3);
      const value = parseInt(group, 10);
      bitBuffer.put(value, 10);
    }

    const remainingNum = this.data.length - i;
    if (remainingNum > 0) {
      const group = this.data.substring(i);
      const value = parseInt(group, 10);
      bitBuffer.put(value, remainingNum * 3 + 1);
    }
  }
}
