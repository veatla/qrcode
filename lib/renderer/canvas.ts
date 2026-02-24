import type { QRCodeCreateResult } from "../core/qrcode";
import * as Utils from "./utils.js";

export type CanvasLike = HTMLCanvasElement;
// {
//   canvas: {};
//   getContext(contextId: "2d"): {
//     clearRect(x: number, y: number, w: number, h: number): void;
//     createImageData(w: number, h: number): { data: Uint8ClampedArray };
//     putImageData(
//       imagedata: { data: Uint8ClampedArray },
//       x: number,
//       y: number,
//     ): void;
//   };
//   width: number;
//   height: number;
//   style?: { width?: string; height?: string };
//   toDataURL(type?: string, quality?: number): string;
// }

function clearCanvas(ctx: CanvasRenderingContext2D | null, canvas: CanvasLike, size: number): void {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  canvas.height = size;
  canvas.width = size;
  if (canvas.style) {
    canvas.style.height = size + "px";
    canvas.style.width = size + "px";
  } else {
    // @ts-expect-error
    canvas.style = { width: size + "px", height: size + "px" };
  }
}

declare const document: { createElement(tag: string): CanvasLike } | undefined;

function getCanvasElement(): CanvasLike {
  try {
    if (typeof document !== "undefined" && document.createElement) {
      return document.createElement("canvas");
    }
    throw new Error("You need to specify a canvas element");
  } catch (e) {
    throw new Error("You need to specify a canvas element");
  }
}

export function render(
  qrData: QRCodeCreateResult,
  canvas: CanvasLike | undefined,
  options?: Parameters<typeof Utils.getOptions>[0],
): CanvasLike;
export function render(
  qrData: QRCodeCreateResult,
  canvas?: CanvasLike,
  options?: Parameters<typeof Utils.getOptions>[0],
): CanvasLike {
  let opts = options as unknown as Utils.RendererOptions;
  let canvasEl = canvas;

  if (typeof opts === "undefined" && (!canvas || !canvas?.getContext)) {
    opts = canvas as unknown as Utils.RendererOptions;
    canvasEl = undefined;
  }

  if (!canvasEl) {
    canvasEl = getCanvasElement();
  }

  opts = Utils.getOptions(opts as unknown as Parameters<typeof Utils.getOptions>[0]);
  const size = Utils.getImageWidth(qrData.modules.size, opts);

  const ctx = canvasEl.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  Utils.qrToImageData(image.data, qrData, opts);

  clearCanvas(ctx, canvasEl, size);
  ctx!.putImageData(image, 0, 0);

  return canvasEl;
}

export function renderToDataURL(
  qrData: QRCodeCreateResult,
  canvas: CanvasLike | undefined,
  options?: Parameters<typeof Utils.getOptions>[0] & {
    type?: string;
    rendererOpts?: { quality?: number };
  },
): string {
  let opts = options;

  if (typeof opts === "undefined" && (!canvas || !canvas?.getContext)) {
    opts = canvas as unknown as Parameters<typeof Utils.getOptions>[0];
    canvas = undefined;
  }

  if (!opts) opts = {};

  const canvasEl = render(qrData, canvas, opts);

  const type = opts.type || "image/png";
  const rendererOpts = opts.rendererOpts || {};

  return canvasEl.toDataURL(type, rendererOpts.quality);
}
