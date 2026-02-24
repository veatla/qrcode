import type BitBuffer from "./bit-buffer";
import { KANJI } from "./mode";
import * as Utils from "./utils";

export default class KanjiData {
  mode = KANJI;
  data: string;

  constructor(data: string) {
    this.data = data;
  }

  static getBitsLength(length: number): number {
    return length * 13;
  }

  getLength(): number {
    return this.data.length;
  }

  getBitsLength(): number {
    return KanjiData.getBitsLength(this.data.length);
  }

  write(bitBuffer: BitBuffer): void {
    for (let i = 0; i < this.data.length; i++) {
      let value = Utils.toSJIS(this.data.charCodeAt(i));

      if (value >= 0x8140 && value <= 0x9ffc) {
        value -= 0x8140;
      } else if (value >= 0xe040 && value <= 0xebbf) {
        value -= 0xc140;
      } else {
        throw new Error(
          "Invalid SJIS character: " +
            this.data[i] +
            "\n" +
            "Make sure your charset is UTF-8",
        );
      }

      value = ((value >>> 8) & 0xff) * 0xc0 + (value & 0xff);
      bitBuffer.put(value, 13);
    }
  }
}
