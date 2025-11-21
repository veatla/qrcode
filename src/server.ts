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
export type Options<Types extends RenderTypes = RenderTypes> = {
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
    version?: string | number;
    toSJISFunc?: (value: string) => number;
    maskPattern?: string | number;
    rendererOpts?: {
        width?: number;
        height?: number;
    };
};
function checkParams<Types extends RenderTypes = RenderTypes>(text: string, opts: Options<Types>, cb: QrCodeCallback | Options<Types> | null) {
    if (typeof text === "undefined") {
        throw new Error("String required as first argument");
    }

    if (typeof cb === "undefined") {
        cb = opts;
        opts = {};
    }

    if (typeof cb !== "function") {
        if (!canPromise()) throw new Error("Callback required as last argument");
        else {
            opts = cb || {};
            cb = null;
        }
    }

    return { opts: opts, cb: cb ?? undefined };
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

function render(
    renderFunc: (data: QRCode.QRCodeResult, opts: Options, cb: QrCodeCallback) => void,
    text: string,
    params: {
        opts: Options;
        cb?: QrCodeCallback;
    },
) {
    if (!params.cb) {
        return new Promise(function (resolve, reject) {
            try {
                const data = QRCode.create(text, params.opts);
                return renderFunc(data, params.opts, function (err, data) {
                    return err ? reject(err) : resolve(data);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    try {
        const data = QRCode.create(text, params.opts);
        return renderFunc(data, params.opts, params.cb);
    } catch (e) {
        params.cb(e, "");
    }
}

export const create = QRCode.create;

export const toString = function toString(text: string, opts: Options, cb: QrCodeCallback) {
    const params = checkParams(text, opts, cb);
    const type: RenderTypes = params.opts?.type ? params.opts.type : "png";
    const renderer = getStringRendererFromType(type);
    return render(renderer.render, text, params);
};

export const toDataURL = function toDataURL(text: string, opts: Options<"png">, cb: QrCodeCallback) {
    const params = checkParams<"png">(text, opts, cb);
    const renderer = getRendererFromType(params.opts.type ?? "image/png");
    return render(renderer.renderToDataURL, text, params);
};

export const toBuffer = function toBuffer(text: string, opts: Options, cb: QrCodeCallback) {
    const params = checkParams(text, opts, cb);
    const renderer = getRendererFromType(params.opts.type ?? "png");
    return render(renderer.renderToBuffer, text, params);
};

export const toFile = function toFile(path: string, text: string, opts: Options, cb: QrCodeCallback) {
    if (typeof path !== "string" || !(typeof text === "string" || typeof text === "object")) {
        throw new Error("Invalid argument");
    }

    if (arguments.length < 3 && !canPromise()) {
        throw new Error("Too few arguments provided");
    }

    const params = checkParams(text, opts, cb);
    const type = params.opts.type || (getTypeFromFilename(path) as RenderTypes);
    const renderer = getRendererFromType(type);
    const renderToFile = renderer.renderToFile.bind(null, path);

    return render(renderToFile, text, params);
};

export const toFileStream = function toFileStream(stream: NodeJS.WritableStream, text: string, opts: Options) {
    if (arguments.length < 2) {
        throw new Error("Too few arguments provided");
    }

    const params = checkParams(text, opts, stream.emit.bind(stream, "error"));
    const renderer = PngRenderer; // Only png support for now
    const renderToFileStream = renderer.renderToFileStream.bind(null, stream);
    render(renderToFileStream, text, params);
};
