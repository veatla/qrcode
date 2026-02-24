import canPromise from "./can-promise.js";
import * as QRCodeCore from "./core/qrcode.js";
import * as CanvasRenderer from "./renderer/canvas.js";
import * as SvgRenderer from "./renderer/svg-tag.js";
import * as RendererUtils from "./renderer/utils.js";
import type { QRCodeOptions } from "./types.js";

type RendererOptionsInput = Parameters<typeof RendererUtils.getOptions>[0];

type RenderFunc = (
  data: QRCodeCore.QRCodeCreateResult,
  canvas: CanvasRenderer.CanvasLike | undefined,
  opts?: RendererOptionsInput,
) => CanvasRenderer.CanvasLike | string;

type Callback = (err: Error | null, result: CanvasRenderer.CanvasLike | string | null) => void;

/** Public API overloads for toCanvas / toDataURL / toString (without bound renderFunc) */
type ToRenderMethod = {
  (text: string, cb: Callback): void;
  (text: string, opts: RendererOptionsInput, cb: Callback): void;
  (canvas: CanvasRenderer.CanvasLike, text: string, cb: Callback): void;
  (canvas: CanvasRenderer.CanvasLike, text: string, opts: RendererOptionsInput, cb: Callback): void;
  (text: string): Promise<CanvasRenderer.CanvasLike | string>;
  (text: string, opts: RendererOptionsInput): Promise<CanvasRenderer.CanvasLike | string>;
  (canvas: CanvasRenderer.CanvasLike, text: string): Promise<CanvasRenderer.CanvasLike | string>;
  (
    canvas: CanvasRenderer.CanvasLike,
    text: string,
    opts: RendererOptionsInput,
  ): Promise<CanvasRenderer.CanvasLike | string>;
};

function renderWithTextCb(renderFunc: RenderFunc, text: string, cb: Callback): void {
  try {
    const data = QRCodeCore.create(text);
    cb(null, renderFunc(data, undefined, undefined));
  } catch (e) {
    cb(e as Error, null);
  }
}

function renderWithTextOptsCb(
  renderFunc: RenderFunc,
  text: string,
  opts: RendererOptionsInput,
  cb: Callback,
): void {
  try {
    const data = QRCodeCore.create(text, opts as QRCodeOptions);
    cb(null, renderFunc(data, undefined, opts));
  } catch (e) {
    cb(e as Error, null);
  }
}

function renderWithCanvasTextCb(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
  cb: Callback,
): void {
  try {
    const data = QRCodeCore.create(text);
    cb(null, renderFunc(data, canvas, undefined));
  } catch (e) {
    cb(e as Error, null);
  }
}

function renderWithCanvasTextOptsCb(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
  opts: RendererOptionsInput,
  cb: Callback,
): void {
  try {
    const data = QRCodeCore.create(text, opts as QRCodeOptions);
    cb(null, renderFunc(data, canvas, opts));
  } catch (e) {
    cb(e as Error, null);
  }
}

function renderWithText(
  renderFunc: RenderFunc,
  text: string,
): Promise<CanvasRenderer.CanvasLike | string> {
  return new Promise((resolve, reject) => {
    try {
      const data = QRCodeCore.create(text);
      resolve(renderFunc(data, undefined, undefined));
    } catch (e) {
      reject(e);
    }
  });
}

function renderWithTextOpts(
  renderFunc: RenderFunc,
  text: string,
  opts: RendererOptionsInput,
): Promise<CanvasRenderer.CanvasLike | string> {
  return new Promise((resolve, reject) => {
    try {
      const data = QRCodeCore.create(text, opts as QRCodeOptions);
      resolve(renderFunc(data, undefined, opts));
    } catch (e) {
      reject(e);
    }
  });
}

function renderWithCanvasText(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
): Promise<CanvasRenderer.CanvasLike | string> {
  return new Promise((resolve, reject) => {
    try {
      const data = QRCodeCore.create(text);
      resolve(renderFunc(data, canvas, undefined));
    } catch (e) {
      reject(e);
    }
  });
}

function renderWithCanvasTextOpts(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
  opts: RendererOptionsInput,
): Promise<CanvasRenderer.CanvasLike | string> {
  return new Promise((resolve, reject) => {
    try {
      const data = QRCodeCore.create(text, opts as QRCodeOptions);
      resolve(renderFunc(data, canvas, opts));
    } catch (e) {
      reject(e);
    }
  });
}
interface dispatchRender {
  (renderFunc: RenderFunc, text: string, cb: Callback): void;
  (renderFunc: RenderFunc, text: string, opts: RendererOptionsInput, cb: Callback): void;
  (renderFunc: RenderFunc, canvas: CanvasRenderer.CanvasLike, text: string, cb: Callback): void;
  (
    renderFunc: RenderFunc,
    canvas: CanvasRenderer.CanvasLike,
    text: string,
    opts: RendererOptionsInput,
    cb: Callback,
  ): void;
  (renderFunc: RenderFunc, text: string): Promise<CanvasRenderer.CanvasLike | string>;
  (
    renderFunc: RenderFunc,
    text: string,
    opts: RendererOptionsInput,
  ): Promise<CanvasRenderer.CanvasLike | string>;
  (
    renderFunc: RenderFunc,
    canvas: CanvasRenderer.CanvasLike,
    text: string,
  ): Promise<CanvasRenderer.CanvasLike | string>;
  (
    renderFunc: RenderFunc,
    canvas: CanvasRenderer.CanvasLike,
    text: string,
    opts: RendererOptionsInput,
  ): Promise<CanvasRenderer.CanvasLike | string>;
  (
    renderFunc: RenderFunc,
    arg0: string | CanvasRenderer.CanvasLike,
    arg1?: string | RendererOptionsInput | Callback,
    arg2?: RendererOptionsInput | Callback,
    arg3?: Callback,
  ): Promise<CanvasRenderer.CanvasLike | string> | void;
}
function dispatchRender(renderFunc: RenderFunc, text: string, cb: Callback): void;
function dispatchRender(
  renderFunc: RenderFunc,
  text: string,
  opts: RendererOptionsInput,
  cb: Callback,
): void;
function dispatchRender(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
  cb: Callback,
): void;
function dispatchRender(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
  opts: RendererOptionsInput,
  cb: Callback,
): void;
function dispatchRender(
  renderFunc: RenderFunc,
  text: string,
): Promise<CanvasRenderer.CanvasLike | string>;
function dispatchRender(
  renderFunc: RenderFunc,
  text: string,
  opts: RendererOptionsInput,
): Promise<CanvasRenderer.CanvasLike | string>;
function dispatchRender(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
): Promise<CanvasRenderer.CanvasLike | string>;
function dispatchRender(
  renderFunc: RenderFunc,
  canvas: CanvasRenderer.CanvasLike,
  text: string,
  opts: RendererOptionsInput,
): Promise<CanvasRenderer.CanvasLike | string>;
function dispatchRender(
  renderFunc: RenderFunc,
  arg0: string | CanvasRenderer.CanvasLike,
  arg1?: string | RendererOptionsInput | Callback,
  arg2?: RendererOptionsInput | Callback,
  arg3?: Callback,
): Promise<CanvasRenderer.CanvasLike | string> | void {
  if (typeof arg3 === "function") {
    return renderWithCanvasTextOptsCb(
      renderFunc,
      arg0 as CanvasRenderer.CanvasLike,
      arg1 as string,
      arg2 as RendererOptionsInput,
      arg3,
    );
  }
  if (typeof arg2 === "function") {
    if (typeof (arg0 as CanvasRenderer.CanvasLike).getContext === "function") {
      return renderWithCanvasTextCb(
        renderFunc,
        arg0 as CanvasRenderer.CanvasLike,
        arg1 as string,
        arg2,
      );
    }
    return renderWithTextOptsCb(renderFunc, arg0 as string, arg1 as RendererOptionsInput, arg2);
  }
  if (typeof arg1 === "function") {
    return renderWithTextCb(renderFunc, arg0 as string, arg1);
  }
  if (!canPromise()) {
    throw new Error("Callback required as last argument");
  }
  if (typeof (arg0 as CanvasRenderer.CanvasLike).getContext === "function") {
    if (arg2 !== undefined) {
      return renderWithCanvasTextOpts(
        renderFunc,
        arg0 as CanvasRenderer.CanvasLike,
        arg1 as string,
        arg2 as RendererOptionsInput,
      );
    }
    return renderWithCanvasText(renderFunc, arg0 as CanvasRenderer.CanvasLike, arg1 as string);
  }
  if (arg1 !== undefined) {
    return renderWithTextOpts(renderFunc, arg0 as string, arg1 as RendererOptionsInput);
  }

  if (!arg0 || typeof arg0 !== "string") {
    throw new Error("String required as first argument");
  }
  return renderWithText(renderFunc, arg0 as string);
}

export default class QRCode {
  static create = QRCodeCore.create;
  static toCanvas = dispatchRender.bind(
    null,
    (
      data: QRCodeCore.QRCodeCreateResult,
      canvas: CanvasRenderer.CanvasLike | undefined,
      opts?: RendererOptionsInput,
    ) => CanvasRenderer.render(data, canvas, opts),
  ) as ToRenderMethod;
  static toDataURL = dispatchRender.bind(
    null,
    (
      data: QRCodeCore.QRCodeCreateResult,
      canvas: CanvasRenderer.CanvasLike | undefined,
      opts?: RendererOptionsInput,
    ) => CanvasRenderer.renderToDataURL(data, canvas, opts),
  ) as ToRenderMethod;
  static toString = dispatchRender.bind(
    null,
    (
      data: QRCodeCore.QRCodeCreateResult,
      _: CanvasRenderer.CanvasLike | undefined,
      opts?: RendererOptionsInput,
    ) => SvgRenderer.render(data, opts),
  ) as ToRenderMethod;
}
