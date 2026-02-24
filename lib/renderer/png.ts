import * as fileSystem from "../helper/fileSystem.js";
import fs from "fs";
import { PNG } from "pngjs";
import type { QRCodeCreateResult } from "../core/qrcode";
import * as Utils from "./utils.js";

export function render(
  qrData: QRCodeCreateResult,
  options?: Parameters<typeof Utils.getOptions>[0],
): InstanceType<typeof PNG> {
  const opts = Utils.getOptions(options);
  const pngOpts = opts.rendererOpts as { width?: number; height?: number };
  const size = Utils.getImageWidth(qrData.modules.size, opts);

  pngOpts.width = size;
  pngOpts.height = size;

  const pngImage = new PNG(pngOpts);
  Utils.qrToImageData(pngImage.data as unknown as Uint8ClampedArray, qrData, opts);

  return pngImage;
}

export function renderToDataURL(
  qrData: QRCodeCreateResult,
  options:
    | Parameters<typeof Utils.getOptions>[0]
    | ((err: Error | null, url: string | null) => void),
  cb?: (err: Error | null, url: string | null) => void,
): void {
  if (typeof cb === "undefined") {
    cb = options as (err: Error | null, url: string | null) => void;
    options = undefined;
  }

  renderToBuffer(qrData, options as Parameters<typeof Utils.getOptions>[0], (err, output) => {
    if (err) {
      cb!(err, null);
      return;
    }
    const url = "data:image/png;base64," + output.toString("base64");
    cb!(null, url as string);
  });
}

export function renderToBuffer(
  qrData: QRCodeCreateResult,
  options: Parameters<typeof Utils.getOptions>[0] | ((err: Error | null, buffer: Buffer) => void),
  cb?: (err: Error | null, buffer: Buffer) => void,
): void {
  if (typeof cb === "undefined") {
    cb = options as (err: Error | null, buffer: Buffer) => void;
    options = undefined;
  }

  const png = render(qrData, options as Parameters<typeof Utils.getOptions>[0]);
  const buffer: Buffer[] = [];

  png.on("error", cb!);

  png.on("data", (data: Buffer) => {
    buffer.push(data);
  });

  png.on("end", () => {
    cb!(null, Buffer.concat(buffer));
  });

  png.pack();
}

export function renderToFile(
  path: string,
  qrData: QRCodeCreateResult,
  options: Parameters<typeof Utils.getOptions>[0] | ((err: Error | null) => void),
  cb?: (err: Error | null) => void,
): void {
  if (typeof cb === "undefined") {
    cb = options as (err: Error | null) => void;
    options = undefined;
  }

  if (options instanceof Function) throw new Error("Callback is not a function");

  let called = false;
  const done = (...args: unknown[]) => {
    if (called) return;
    called = true;
    (cb as (...a: unknown[]) => void).apply(null, args);
  };
  const stream = (options?.createStream ?? fileSystem.createWriteStream)(path);

  stream.on("error", done);
  stream.on("close", done);

  renderToFileStream(stream, qrData, options as Parameters<typeof Utils.getOptions>[0]);
}

export function renderToFileStream(
  stream: NodeJS.WritableStream,
  qrData: QRCodeCreateResult,
  options?: Parameters<typeof Utils.getOptions>[0],
): void {
  const png = render(qrData, options);
  png.pack().pipe(stream);
}
