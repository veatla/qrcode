import type { QRCodeCreateResult } from "../core/qrcode";
import fs from "fs";
import * as svgTagRenderer from "./svg-tag.js";

export const render = svgTagRenderer.render;

export function renderToFile(
  path: string,
  qrData: QRCodeCreateResult,
  options:
    | Parameters<typeof svgTagRenderer.render>[1]
    | ((err: NodeJS.ErrnoException | null) => void),
  cb?: (err: NodeJS.ErrnoException | null) => void,
): void {
  if (typeof cb === "undefined") {
    cb = options as (err: NodeJS.ErrnoException | null) => void;
    options = undefined;
  }

  const svgTag = render(
    qrData,
    options as Parameters<typeof svgTagRenderer.render>[1],
  );

  const xmlStr =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
    svgTag;

  fs.writeFile(path, xmlStr, cb!);
}
