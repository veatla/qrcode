import { createWriteStream } from "fs";
import { PNG } from "pngjs";
import { getOptions, getImageWidth, qrToImageData } from "./utils";
import type { QRCodeResult } from "../core/qrcode";
import type { Options, QrCodeCallback } from "../server";
import type { RendererTypes } from "./types";

class PngRendererClass implements RendererTypes<PNG> {
    renderToFileStream(stream: NodeJS.WritableStream, qrData: QRCodeResult, options?: Options) {
        const png = this.render(qrData, options);
        png.pack().pipe(stream);
    }

    renderToFile(path: string, qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined) {
        if (typeof cb === "undefined") {
            cb = options;
            options = undefined;
        }

        let called = false;
        const done = (args?: Error) => {
            if (called) return;
            called = true;
            (cb as QrCodeCallback).apply(null, [args]);
        };
        const stream = createWriteStream(path);

        stream.on("error", done);
        stream.on("close", done);

        this.renderToFileStream(stream, qrData, options);
    }

    renderToBuffer(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | undefined) {
        const png = this.render(qrData, options);
        const buffer: Uint8Array<ArrayBufferLike>[] = [];

        png.on("error", (err) => typeof cb === "function" && cb(err));

        png.on("data", function (data: Uint8Array<ArrayBufferLike>) {
            buffer.push(data);
        });

        png.on("end", function () {
            if (typeof cb === "function") cb(null, Buffer.concat(buffer));
        });

        png.pack();
    }

    renderToDataURL(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined) {
        if (typeof cb === "undefined") {
            cb = options;
            options = undefined;
        }

        this.renderToBuffer(qrData, options, function (err, output) {
            if (typeof cb === "function" && output) {
                if (err) cb(err);
                let url = "data:image/png;base64,";
                url += output.toString("base64");
                cb(null, url);
            }
        });
    }

    render(qrData: QRCodeResult, options?: Options) {
        const opts = getOptions(options);
        const pngOpts: Options["rendererOpts"] = opts.rendererOpts ?? {};
        const size = getImageWidth(qrData.modules.size, opts);

        pngOpts.width = size;
        pngOpts.height = size;

        const pngImage = new PNG(pngOpts);
        qrToImageData(pngImage.data, qrData, opts);

        return pngImage;
    }
}

const PngRenderer = new PngRendererClass();
export default PngRenderer;
