import * as Polynomial from "./polynomial";

export default class ReedSolomonEncoder {
  genPoly: Uint8Array | undefined;
  degree: number;

  constructor(degree: number) {
    this.genPoly = undefined;
    this.degree = degree;

    if (this.degree) this.initialize(this.degree);
  }

  initialize(degree: number): void {
    this.degree = degree;
    this.genPoly = Polynomial.generateECPolynomial(this.degree);
  }

  encode(data: Uint8Array): Uint8Array {
    if (!this.genPoly) {
      throw new Error("Encoder not initialized");
    }

    const paddedData = new Uint8Array(data.length + this.degree);
    paddedData.set(data);

    const remainder = Polynomial.mod(paddedData, this.genPoly);

    const start = this.degree - remainder.length;
    if (start > 0) {
      const buff = new Uint8Array(this.degree);
      buff.set(remainder, start);
      return buff;
    }

    return remainder;
  }
}
