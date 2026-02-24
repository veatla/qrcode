import canPromise from "./can-promise";
import * as QRCode from "./core/qrcode";
import * as CanvasRenderer from "./renderer/canvas";
import * as SvgRenderer from "./renderer/svg-tag";
import * as RendererUtils from "./renderer/utils";
import type { QRCodeCreateResult } from "./core/qrcode";
import type { CanvasLike } from "./renderer/canvas";

type RendererOptionsInput = Parameters<typeof RendererUtils.getOptions>[0];

function renderCanvas(
  renderFunc: (
    data: QRCodeCreateResult,
    canvas: CanvasLike | undefined,
    opts?: unknown,
  ) => CanvasLike | string,
  canvas: CanvasLike | undefined,
  text: string,
  opts: unknown,
  cb: (err: Error | null, result: CanvasLike | string) => void,
): void;
function renderCanvas(
  renderFunc: (
    data: QRCodeCreateResult,
    canvas: CanvasLike | undefined,
    opts?: unknown,
  ) => CanvasLike | string,
  canvas: CanvasLike | undefined,
  text: string,
  opts?: unknown,
): Promise<CanvasLike | string>;
function renderCanvas(
  renderFunc: (
    data: QRCodeCreateResult,
    canvas: CanvasLike | undefined,
    opts?: unknown,
  ) => CanvasLike | string,
  ...args: unknown[]
): Promise<CanvasLike | string> | void {
  const argsList = [].slice.call(arguments, 1) as unknown[];
  const argsNum = argsList.length;
  const isLastArgCb = typeof argsList[argsNum - 1] === "function";

  if (!isLastArgCb && !canPromise()) {
    throw new Error("Callback required as last argument");
  }

  if (isLastArgCb) {
    let canvasArg: CanvasLike | undefined = argsList[0] as
      | CanvasLike
      | undefined;
    let textArg: string = argsList[1] as string;
    let optsArg: unknown = argsList[2];
    let cbArg: (err: Error | null, result: CanvasLike | string | null) => void =
      argsList[argsNum - 1] as (
        err: Error | null,
        result: CanvasLike | string | null,
      ) => void;

    if (argsNum < 2) {
      throw new Error("Too few arguments provided");
    }

    if (argsNum === 2) {
      cbArg = argsList[1] as (
        err: Error | null,
        result: CanvasLike | string | null,
      ) => void;
      textArg = argsList[0] as string;
      canvasArg = optsArg = undefined;
    } else if (argsNum === 3) {
      if (
        (argsList[0] as CanvasLike).getContext &&
        typeof argsList[2] === "undefined"
      ) {
        cbArg = argsList[2] as unknown as (
          err: Error | null,
          result: CanvasLike | string | null,
        ) => void;
        optsArg = undefined;
      } else {
        cbArg = argsList[2] as (
          err: Error | null,
          result: CanvasLike | string | null,
        ) => void;
        optsArg = argsList[1];
        textArg = argsList[0] as string;
        canvasArg = undefined;
      }
    }

    try {
      const data = QRCode.create(
        textArg,
        optsArg as import("./types").QRCodeOptions,
      );
      cbArg(null, renderFunc(data, canvasArg, optsArg));
    } catch (e) {
      cbArg(e as Error, null);
    }
    return;
  }

  let canvasArg2 = argsList[0] as CanvasLike | undefined;
  let textArg2 = argsList[1] as string;
  let optsArg2 = argsList[2] as unknown;

  if (argsNum < 1) {
    throw new Error("Too few arguments provided");
  }

  if (argsNum === 1) {
    textArg2 = argsList[0] as string;
    canvasArg2 = optsArg2 = undefined;
  } else if (argsNum === 2 && !(argsList[1] as CanvasLike).getContext) {
    optsArg2 = argsList[1];
    textArg2 = argsList[0] as string;
    canvasArg2 = undefined;
  }

  return new Promise((resolve, reject) => {
    try {
      const data = QRCode.create(
        textArg2,
        optsArg2 as import("./types").QRCodeOptions,
      );
      resolve(renderFunc(data, canvasArg2, optsArg2));
    } catch (e) {
      reject(e);
    }
  });
}

export const create = QRCode.create;

export const toCanvas = renderCanvas.bind(
  null,
  (data: QRCodeCreateResult, canvas: CanvasLike | undefined, opts?: unknown) =>
    CanvasRenderer.render(data, canvas, opts as RendererOptionsInput),
);
export const toDataURL = renderCanvas.bind(
  null,
  (data: QRCodeCreateResult, canvas: CanvasLike | undefined, opts?: unknown) =>
    CanvasRenderer.renderToDataURL(data, canvas, opts as RendererOptionsInput),
);

export const toString = renderCanvas.bind(
  null,
  (data: QRCodeCreateResult, _: CanvasLike | undefined, opts?: unknown) =>
    SvgRenderer.render(data, opts as RendererOptionsInput),
);
