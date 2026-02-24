import canPromise from "./can-promise";
import * as QRCode from "./core/qrcode";
import * as PngRenderer from "./renderer/png";
import * as Utf8Renderer from "./renderer/utf8";
import * as TerminalRenderer from "./renderer/terminal";
import * as SvgRenderer from "./renderer/svg";
import type { QRCodeOptions } from "./types";

interface CheckParamsResult {
  opts: QRCodeOptions;
  cb: ((err: Error | null, result: unknown) => void) | null;
}

function checkParams(
  text: string | undefined,
  opts: QRCodeOptions | ((err: Error | null, result: unknown) => void),
  cb?: (err: Error | null, result: unknown) => void,
): CheckParamsResult {
  if (typeof text === "undefined") {
    throw new Error("String required as first argument");
  }

  if (typeof cb === "undefined") {
    cb = opts as (err: Error | null, result: unknown) => void;
    opts = {};
  }

  if (typeof cb !== "function") {
    if (!canPromise()) {
      throw new Error("Callback required as last argument");
    } else {
      opts = (cb as unknown as QRCodeOptions) || {};
      cb = undefined;
    }
  }

  return {
    opts: opts as QRCodeOptions,
    cb: cb as ((err: Error | null, result: unknown) => void) | null,
  };
}

function getTypeFromFilename(path: string): string {
  return path.slice(((path.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

function getRendererFromType(type?: string) {
  switch (type) {
    case "svg":
      return SvgRenderer;

    case "txt":
    case "utf8":
      return Utf8Renderer;

    case "png":
    case "image/png":
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
    default:
      return Utf8Renderer;
  }
}

function render<T = unknown>(
  renderFunc: (
    data: import("./core/qrcode").QRCodeCreateResult,
    opts: unknown,
    cb: (err: Error | null, data: T) => void,
  ) => void,
  text: string,
  params: CheckParamsResult,
): Promise<T> | void {
  if (!params.cb) {
    return new Promise<T>((resolve, reject) => {
      try {
        const data = QRCode.create(text, params.opts);
        return renderFunc(data, params.opts, (err, data) => {
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
    params.cb?.(e as Error, null);
  }
}

export const create = QRCode.create;

export { toCanvas } from "./browser";

export function toString(
  text: string,
  opts?: QRCodeOptions | ((err: Error | null, result: string) => void),
  cb?: (err: Error | null, result: string) => void,
): Promise<string> | void {
  const params = checkParams(
    text,
    opts as QRCodeOptions,
    cb as (err: Error | null, result: unknown) => void,
  );
  const type = params.opts?.type;
  const renderer = getStringRendererFromType(type);
  return render<string>(
    renderer.render as (
      data: import("./core/qrcode").QRCodeCreateResult,
      opts: unknown,
      cb: (err: Error | null, data: string) => void,
    ) => void,
    text,
    params,
  );
}

export function toDataURL(
  text: string,
  opts?: QRCodeOptions | ((err: Error | null, result: string) => void),
  cb?: (err: Error | null, result: string) => void,
): Promise<string> | void {
  const params = checkParams(
    text,
    opts as QRCodeOptions,
    cb as (err: Error | null, result: unknown) => void,
  );
  const type = params.opts?.type;
  if (type === "svg") {
    return render<string>(
      (data, _opts, cb) => {
        const svgStr = SvgRenderer.render(data, params.opts);
        const dataUrl =
          "data:image/svg+xml;base64," + Buffer.from(svgStr).toString("base64");
        cb(null, dataUrl);
      },
      text,
      params,
    );
  }
  return render<string>(
    PngRenderer.renderToDataURL as (
      data: import("./core/qrcode").QRCodeCreateResult,
      opts: unknown,
      cb: (err: Error | null, data: string) => void,
    ) => void,
    text,
    params,
  );
}

export function toBuffer(
  text: string,
  opts?: QRCodeOptions | ((err: Error | null, result: Buffer) => void),
  cb?: (err: Error | null, result: Buffer) => void,
): Promise<Buffer> | void {
  const params = checkParams(
    text,
    opts as QRCodeOptions,
    cb as (err: Error | null, result: unknown) => void,
  );
  const type = params.opts?.type;
  if (type === "svg") {
    return render<Buffer>(
      (data, _opts, cb) => {
        const svgStr = SvgRenderer.render(data, params.opts);
        cb(null, Buffer.from(svgStr));
      },
      text,
      params,
    );
  }
  return render<Buffer>(
    PngRenderer.renderToBuffer as (
      data: import("./core/qrcode").QRCodeCreateResult,
      opts: unknown,
      cb: (err: Error | null, data: Buffer) => void,
    ) => void,
    text,
    params,
  );
}

export function toFile(
  path: string,
  text: string,
  opts?: QRCodeOptions | ((err: Error | null) => void),
  cb?: (err: Error | null) => void,
): Promise<void> | void {
  if (
    typeof path !== "string" ||
    !(typeof text === "string" || typeof text === "object")
  ) {
    throw new Error("Invalid argument");
  }

  if (arguments.length < 3 && !canPromise()) {
    throw new Error("Too few arguments provided");
  }

  const params = checkParams(
    text,
    opts as QRCodeOptions,
    cb as (err: Error | null, result: unknown) => void,
  );
  const type = params.opts?.type || getTypeFromFilename(path);
  const renderer = getRendererFromType(type);
  const renderToFile = renderer.renderToFile!.bind(null, path);

  return render<void>(
    renderToFile as (
      data: import("./core/qrcode").QRCodeCreateResult,
      opts: unknown,
      cb: (err: Error | null, data: void) => void,
    ) => void,
    text,
    params,
  );
}

export function toFileStream(
  stream: NodeJS.WritableStream & {
    emit: (event: string, err?: Error) => void;
  },
  text: string,
  opts?: QRCodeOptions,
): void {
  if (arguments.length < 2) {
    throw new Error("Too few arguments provided");
  }

  const params = checkParams(
    text,
    opts as QRCodeOptions,
    stream.emit.bind(stream, "error") as (
      err: Error | null,
      result: unknown,
    ) => void,
  );
  const renderToFileStream = PngRenderer.renderToFileStream.bind(
    PngRenderer,
    stream,
  );
  render(
    renderToFileStream as (
      data: import("./core/qrcode").QRCodeCreateResult,
      opts: unknown,
      cb: (err: Error | null, data: unknown) => void,
    ) => void,
    text,
    params,
  );
}
