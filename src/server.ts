import canPromise from "./utils/can-promise";
import * as QRCode from "./core/qrcode";
import PngRenderer from "./renderer/png";
import Utf8Renderer from "./renderer/utf8";
import TerminalRenderer from "./renderer/terminal";
import SvgRenderer from "./renderer/svg";
import type { ErrorCorrectionType } from "./core/lib/error-correction-level";
import type { Color } from "./renderer/utils";
export type QrCodeCallback = (err: unknown, data?: string | Buffer<ArrayBuffer>) => void;

export type RenderTypes = "svg" | "txt" | "utf8" | "png" | "image/png" | "terminal";
export type Options<Types extends RenderTypes = "svg" | "txt" | "utf8" | "png" | "image/png" | "terminal"> = {
    errorCorrectionLevel?: string | ErrorCorrectionType;
    type?: Types;
    color?: {
        dark?: Color;
        light?: Color;
    };
    margin?: number | null;
    width?: number | null;
    scale?: number | null;
    small?: boolean;
    inverse?: boolean;
    version?: string | number;
    toSJISFunc?: (value: string) => number;
    maskPattern?: string | number;
    rendererOpts?: {
        width?: number;
        height?: number;
        quality?: number;
    };
};
function checkParams<Types extends RenderTypes = RenderTypes>(text: string, opts: Options<Types>, cb?: QrCodeCallback) {
    if (typeof text === "undefined") {
        throw new Error("String required as first argument");
    }

    // if (typeof cb === "undefined") {
    //     cb = opts;
    //     opts = {};
    // }

    if (typeof cb !== "function") {
        if (!canPromise()) throw new Error("Callback required as last argument");
        else {
            opts = cb || {};
            cb = undefined;
        }
    }

    return { opts: opts, cb: cb };
}

function getTypeFromFilename(path: string) {
    return path.slice(((path.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

function getRendererFromType(type: RenderTypes) {
    switch (type) {
        case "svg":
            return SvgRenderer;
        case "txt":
        case "utf8":
            return Utf8Renderer;
        case "png":
        case "image/png":
            return PngRenderer;
        default:
            return PngRenderer;
    }
}

function getStringRendererFromType(type: RenderTypes) {
    switch (type) {
        case "svg":
            return SvgRenderer;

        case "terminal":
            return TerminalRenderer;

        case "utf8":
            return Utf8Renderer;
        default:
            return Utf8Renderer;
    }
}
interface RenderFunction {
    (renderFunc: (data: QRCode.QRCodeResult, opts: Options, cb: QrCodeCallback) => void, text: string, opts: Options, cb?: QrCodeCallback): any;
    (renderFunc: (data: QRCode.QRCodeResult, opts: Options, cb: QrCodeCallback) => void, text: string, opts: Options, cb?: undefined): any;
}

const render: RenderFunction = function render(renderFunc, text, opts, cb) {
    if (!cb) {
        return new Promise<string | Buffer<ArrayBuffer>>((resolve, reject) => {
            try {
                const data = QRCode.create(text, opts);
                renderFunc(data, opts, (err, out) => {
                    if (err) reject(err);
                    else resolve(out as string | Buffer<ArrayBuffer>);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    try {
        const data = QRCode.create(text, opts);
        renderFunc(data, opts, cb);
    } catch (e) {
        cb(e as Error, undefined);
    }
};

export const create = QRCode.create;

interface RenderToDataFunction<Types extends RenderTypes = "png" | "image/png" | "svg" | "txt" | "utf8" | "terminal"> {
    (text: string, opts: Options<Types>, cb?: undefined): Promise<string | Buffer<ArrayBuffer>>;
    (text: string, opts: Options<Types>, cb?: QrCodeCallback): void;
}
export const toString: RenderToDataFunction = function toString(text, opts, cb) {
    const params = checkParams(text, opts, cb);
    const type: RenderTypes = params.opts?.type ? params.opts.type : "png";
    const renderer = getStringRendererFromType(type);
    return render(renderer.render, text, params.opts, params.cb);
};

export const toDataURL: RenderToDataFunction<"png" | "image/png"> = (text, opts, cb) => {
    const params = checkParams(text, opts, cb);
    const renderer = getRendererFromType(params.opts.type ?? "image/png");
    return render(renderer.renderToDataURL, text, params.opts, params.cb);
};

export const toBuffer: RenderToDataFunction = (text, opts, cb?) => {
    const params = checkParams(text, opts, cb);
    const renderer = getRendererFromType(params.opts.type ?? "png");
    return render(renderer.renderToBuffer, text, params.opts, params.cb);
};

interface RenderToFile<Types extends RenderTypes = "png" | "image/png" | "svg" | "txt" | "utf8" | "terminal"> {
    (path: string, text: string, opts: Options<Types>, cb?: undefined): Promise<string | Buffer<ArrayBuffer>>;
    (path: string, text: string, opts: Options<Types>, cb?: QrCodeCallback): void;
}
export const toFile: RenderToFile = function (path, text, opts, cb) {
    if (typeof path !== "string" || !(typeof text === "string" || typeof text === "object")) {
        throw new Error("Invalid argument");
    }

    if (arguments.length < 3 && !canPromise()) throw new Error("Too few arguments provided");

    const params = checkParams(text, opts, cb);
    const type = params.opts.type || (getTypeFromFilename(path) as RenderTypes);
    const renderer = getRendererFromType(type);
    const renderToFile = renderer.renderToFile.bind(null, path);

    return render(renderToFile, text, params.opts, params.cb);
};

export function toFileStream(stream: NodeJS.WritableStream, text: string, opts: Options) {
    if (arguments.length < 2) throw new Error("Too few arguments provided");

    const params = checkParams(text, opts, stream.emit.bind(stream, "error"));

    const renderer = PngRenderer; // Only png support for now

    const renderToFileStream = renderer.renderToFileStream.bind(null, stream);
    return render(renderToFileStream, text, params.opts, params.cb);
}
