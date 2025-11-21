export default class BitBuffer {
    buffer: number[] = [];
    length = 0;

    get(index: number) {
        const bufferIndex = Math.floor(index / 8);
        return ((Number(this.buffer[bufferIndex]) >>> (7 - (index % 8))) & 1) === 1;
    }

    put(num: number, length: number) {
        for (let i = 0; i < length; i++) {
            this.putBit(Number(((num >>> (length - i - 1)) & 1) === 1));
        }
    }

    getLengthInBits() {
        return this.length;
    }

    putBit(bit: number) {
        const bufferIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufferIndex) this.buffer.push(0);

        if (bit) this.buffer[bufferIndex]! |= 0x80 >>> this.length % 8;

        this.length++;
    }
}
