export default class BitMatrix {
    data: Uint8Array<ArrayBuffer>;
    reservedBit: Uint8Array<ArrayBuffer>;

    /**
     * Helper class to handle QR Code symbol modules
     *
     * @param {Number} size Symbol size
     */
    constructor(public size: number) {
        if (!size || size < 1) {
            throw new Error("BitMatrix size must be defined and greater than 0");
        }

        this.data = new Uint8Array(size * size);
        this.reservedBit = new Uint8Array(size * size);
    }

    /**
     * Set bit value at specified location
     * If reserved flag is set, this bit will be ignored during masking process
     *
     * @param {Number}  row
     * @param {Number}  col
     * @param {Boolean} value
     * @param {Boolean} reserved
     */
    set(row: number, col: number, value: number, reserved: boolean = false) {
        const index = row * this.size + col;
        this.data[index] = value;
        if (reserved) this.reservedBit[index] = 1;
    }

    /**
     * Returns bit value at specified location
     *
     * @param  {Number}  row
     * @param  {Number}  col
     * @return {Boolean}
     */
    get(row: number, col: number): boolean {
        return Boolean(this.data[row * this.size + col]);
    }

    /**
     * Applies xor operator at specified location
     * (used during masking process)
     *
     * @param {Number}  row
     * @param {Number}  col
     * @param {Boolean} value
     */
    xor(row: number, col: number, value: boolean) {
        this.data[row * this.size + col]! ^= Number(value);
    }

    /**
     * Check if bit at specified location is reserved
     *
     * @param {Number}   row
     * @param {Number}   col
     * @return {Boolean}
     */
    isReserved(row: number, col: number): boolean {
        return Boolean(this.reservedBit[row * this.size + col]);
    }
}
