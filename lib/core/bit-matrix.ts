/**
 * Helper class to handle QR Code symbol modules
 */
export default class BitMatrix {
  size: number;
  data: Uint8Array;
  reservedBit: Uint8Array;

  constructor(size: number) {
    if (!size || size < 1) {
      throw new Error("BitMatrix size must be defined and greater than 0");
    }

    this.size = size;
    this.data = new Uint8Array(size * size);
    this.reservedBit = new Uint8Array(size * size);
  }

  set(
    row: number,
    col: number,
    value: number | boolean,
    reserved?: boolean,
  ): void {
    const index = row * this.size + col;
    this.data[index] = value ? 1 : 0;
    if (reserved) this.reservedBit[index] = 1;
  }

  get(row: number, col: number): number {
    return this.data[row * this.size + col];
  }

  xor(row: number, col: number, value: number | boolean): void {
    this.data[row * this.size + col] ^= value ? 1 : 0;
  }

  isReserved(row: number, col: number): boolean {
    return this.reservedBit[row * this.size + col] === 1;
  }
}
