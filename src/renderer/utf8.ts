import type { QRCodeResult } from "../core/qrcode";
import type { Options, QrCodeCallback } from "../server";
import type { RendererTypes } from "./types";
import { getOptions } from "./utils";
type BlocsType = {
    BB: string;
    BW: string;
    WW: string;
    WB: string;
};
const BLOCK_CHAR: BlocsType = {
    WW: " ",
    WB: "▄",
    BB: "█",
    BW: "▀",
};

const INVERTED_BLOCK_CHAR: BlocsType = {
    BB: " ",
    BW: "▄",
    WW: "█",
    WB: "▀",
};

class Utf8RendererClass implements RendererTypes<string> {
    renderToBuffer(qrData: unknown, options: unknown, cb: unknown): void {
        throw new Error("Method not implemented.");
    }
    renderToDataURL(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined): void {
        throw new Error("Method not implemented.");
    }
    getBlockChar(top: number, bottom: number, blocks: BlocsType) {
        if (top && bottom) return blocks.BB;
        if (top && !bottom) return blocks.BW;
        if (!top && bottom) return blocks.WB;
        return blocks.WW;
    }

    render(qrData: QRCodeResult, options: Options, cb?: QrCodeCallback) {
        const opts = getOptions(options);
        let blocks = BLOCK_CHAR;
        if (opts.color.dark.hex === "#ffffff" || opts.color.light.hex === "#000000") {
            blocks = INVERTED_BLOCK_CHAR;
        }

        const size = qrData.modules.size;
        const data = qrData.modules.data;

        let output = "";
        let hMargin = Array(size + opts.margin * 2 + 1).join(blocks.WW);
        hMargin = Array(opts.margin / 2 + 1).join(hMargin + "\n");

        const vMargin = Array(opts.margin + 1).join(blocks.WW);

        output += hMargin;
        for (let i = 0; i < size; i += 2) {
            output += vMargin;
            for (let j = 0; j < size; j++) {
                const topModule = data[i * size + j];
                const bottomModule = data[(i + 1) * size + j];

                output += this.getBlockChar(topModule, bottomModule, blocks);
            }

            output += vMargin + "\n";
        }

        output += hMargin.slice(0, -1);

        if (typeof cb === "function") {
            cb(null, output);
        }

        return output;
    }

    renderToFile(path: string, qrData: QRCodeResult, options: Options, cb: QrCodeCallback) {
        const fs = require("fs");
        const utf8 = this.render(qrData, options);
        fs.writeFile(path, utf8, cb);
    }
}
const Utf8Renderer = new Utf8RendererClass();
export default Utf8Renderer;
