import GaloisField from "./galois-field";

const Multiplication = (polynomial1: Uint8Array<ArrayBuffer>, polynomial2: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> => {
    const result = new Uint8Array(polynomial1.length + polynomial2.length - 1);

    for (let i = 0; i < polynomial1.length; i++) {
        for (let j = 0; j < polynomial2.length; j++) {
            result[i + j]! ^= GaloisField.mul(polynomial1[i]!, polynomial2[j]!);
        }
    }

    return result;
};

const Modulo = (polynomial1: Uint8Array, polynomial2: Uint8Array): Uint8Array => {
    let result = new Uint8Array(polynomial1);

    while (result.length - polynomial2.length >= 0) {
        const coeff = result[0];

        for (let i = 0; i < polynomial2.length; i++) {
            result[i]! ^= GaloisField.mul(polynomial2[i]!, coeff!);
        }

        // remove all zeros from buffer head
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
    }

    return result;
};

const GeneratePolynomial = (degree: number) => {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
        poly = Multiplication(poly, new Uint8Array([1, GaloisField.exp(i)!]));
    }

    return poly;
};

class ReedSolomonEncoder {
    private degree!: number;
    private poly!: Uint8Array;

    constructor(degree: number) {
        this.encode = this.encode.bind(this);
        this.initialize = this.initialize.bind(this);
        this.degree = degree;
        this.initialize();
    }

    public initialize() {
        if (this.degree) this.poly = GeneratePolynomial(this.degree);
    }

    public encode(data: Uint8Array) {
        if (!this.poly) throw new Error("Encoder not initialized!");

        const padded = new Uint8Array(data.length + this.degree);
        padded.set(data);

        const reminder = Modulo(padded, this.poly);

        const start = this.degree - reminder.length;

        if (start > 0) {
            const buff = new Uint8Array(this.degree);
            buff.set(reminder, start);

            return buff;
        }

        return reminder;
    }
}

export default ReedSolomonEncoder;
