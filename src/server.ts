import canPromise from "./utils/can-promise";
import * as QRCode from "./core/qrcode";
import * as PngRenderer from "./renderer/png";
import * as Utf8Renderer from "./renderer/utf8";
import TerminalRenderer from "./renderer/terminal";
import * as SvgRenderer from "./renderer/svg";
import type { ErrorCorrectionType } from "./core/lib/error-correction-level";
type QrCodeCallback = (err: unknown, data: string) => void;

export type Options = {
    errorCorrectionLevel?: string | ErrorCorrectionType;
    type?: string;
    version?: string | number;
    toSJISFunc?: (value: string) => number;
    maskPattern?: string | number;
};
function checkParams(text: string, opts: Options, cb: QrCodeCallback | Options | null) {
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

function getRendererFromType(type?: string) {
    switch (type) {
        case "svg":
            return SvgRenderer;

        case "txt":
            return Utf8Renderer;
        case "utf8":
            return Utf8Renderer;

        case "png":
            return PngRenderer;
        case "image/png":
            return PngRenderer;

        default:
            return PngRenderer;
    }
}

function getStringRendererFromType(type?: string) {
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
    const type = params.opts ? params.opts.type : undefined;
    const renderer = getStringRendererFromType(type);
    return render(renderer.render, text, params);
};

export const toDataURL = function toDataURL(text: string, opts, cb) {
    const params = checkParams(text, opts, cb);
    const renderer = getRendererFromType(params.opts.type);
    return render(renderer.renderToDataURL, text, params);
};

export const toBuffer = function toBuffer(text: string, opts, cb) {
    const params = checkParams(text, opts, cb);
    const renderer = getRendererFromType(params.opts.type);
    return render(renderer.renderToBuffer, text, params);
};

export const toFile = function toFile(path: string, text: string, opts, cb) {
    if (typeof path !== "string" || !(typeof text === "string" || typeof text === "object")) {
        throw new Error("Invalid argument");
    }

    if (arguments.length < 3 && !canPromise()) {
        throw new Error("Too few arguments provided");
    }

    const params = checkParams(text, opts, cb);
    const type = params.opts.type || getTypeFromFilename(path);
    const renderer = getRendererFromType(type);
    const renderToFile = renderer.renderToFile.bind(null, path);

    return render(renderToFile, text, params);
};

export const toFileStream = function toFileStream(stream, text: string, opts: Options) {
    if (arguments.length < 2) {
        throw new Error("Too few arguments provided");
    }

    const params = checkParams(text, opts, stream.emit.bind(stream, "error"));
    const renderer = PngRenderer; // Only png support for now
    const renderToFileStream = renderer.renderToFileStream.bind(null, stream);
    render(renderToFileStream, text, params);
};
