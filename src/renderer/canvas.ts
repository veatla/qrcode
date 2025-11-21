import * as Utils from "./utils";
import type { QRCodeResult } from "../core/qrcode";
import type { Options } from "../server";

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, size: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.height = size;
    canvas.width = size;
    canvas.style.height = size + "px";
    canvas.style.width = size + "px";
}

function getCanvasElement() {
    try {
        return document.createElement("canvas");
    } catch (e) {
        throw new Error("You need to specify a canvas element");
    }
}

export const render = function render(qrData: QRCodeResult, canvas: HTMLCanvasElement | undefined, options?: Options) {
    let opts = options;
    let canvasEl = canvas;

    if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = undefined;
    }

    if (!canvas) canvasEl = getCanvasElement();

    opts = Utils.getOptions(opts);
    const size = Utils.getImageWidth(qrData.modules.size, opts);

    if (!canvasEl) throw new Error("Unable to get canvas element!");

    const ctx = canvasEl.getContext("2d")!;
    const image = ctx.createImageData(size, size);
    Utils.qrToImageData(image.data, qrData, opts);

    clearCanvas(ctx, canvasEl, size);
    ctx.putImageData(image, 0, 0);

    return canvasEl;
};

export const renderToDataURL = function renderToDataURL(qrData: QRCodeResult, canvas: HTMLCanvasElement | undefined, options?: Options) {
    let opts = options;

    if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = undefined;
    }

    if (!opts) opts = {};

    const canvasEl = render(qrData, canvas, opts);

    const type = opts.type || "image/png";
    const rendererOpts = opts.rendererOpts || {};

    return canvasEl.toDataURL(type, rendererOpts.quality);
};
