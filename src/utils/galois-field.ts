const exponentiation_table = new Uint8Array(512);
const logarithms_table = new Uint8Array(256);

const GaloisField = new (class GaloisField {
    constructor() {
        this.log = this.log.bind(this);
        this.exp = this.exp.bind(this);
        this.mul = this.mul.bind(this);

        let x = 1;
        for (let i = 0; i < 255; i++) {
            exponentiation_table[i] = x;
            logarithms_table[x] = i;

            x <<= 1;

            if (x & 0x100) x ^= 0x11d;
        }

        for (let i = 255; i < 512; i++) {
            exponentiation_table[i] = exponentiation_table[i - 255]!;
        }
    }

    log(value: number) {
        if (value < 1) throw new Error(`log(${value})`);
        return logarithms_table[value];
    }

    exp(value: number) {
        return exponentiation_table[value];
    }

    mul(x: number, y: number) {
        if (x === 0 || y === 0) return 0;

        return exponentiation_table[logarithms_table[x]! + logarithms_table[y]!]!;
    }
})();
export default GaloisField;
