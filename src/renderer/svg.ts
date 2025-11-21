import type { QRCodeResult } from "../core/qrcode";
import type { Options, QrCodeCallback } from "../server";
import * as svgTagRenderer from "./svg-tag";
import type { RendererTypes } from "./types";

class SvgRendererClass implements RendererTypes<string> {
    renderToBuffer(qrData: unknown, options: unknown, cb: unknown): void {
        throw new Error("Method not implemented.");
    }
    renderToDataURL(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined): void {
        throw new Error("Method not implemented.");
    }
    render = svgTagRenderer.render;

    renderToFile(path: string, qrData: QRCodeResult, options: Options, cb?: QrCodeCallback) {
        const fs = require("fs");
        const svgTag = this.render(qrData, options);

        const xmlStr = '<?xml version="1.0" encoding="utf-8"?>' + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + svgTag;

        fs.writeFile(path, xmlStr, cb);
    }
}

const SvgRenderer = new SvgRendererClass();

export default SvgRenderer;
