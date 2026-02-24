import type BitBuffer from "./bit-buffer";
import { ALPHANUMERIC } from "./mode.js";

const ALPHA_NUM_CHARS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  " ",
  "$",
  "%",
  "*",
  "+",
  "-",
  ".",
  "/",
  ":",
];

export default class AlphanumericData {
  mode = ALPHANUMERIC;
  data: string;

  constructor(data: string) {
    this.data = data;
  }

  static getBitsLength(length: number): number {
    return 11 * Math.floor(length / 2) + 6 * (length % 2);
  }

  getLength(): number {
    return this.data.length;
  }

  getBitsLength(): number {
    return AlphanumericData.getBitsLength(this.data.length);
  }

  write(bitBuffer: BitBuffer): void {
    let i = 0;
    for (; i + 2 <= this.data.length; i += 2) {
      let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
      value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
      bitBuffer.put(value, 11);
    }
    if (this.data.length % 2) {
      bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
    }
  }
}
