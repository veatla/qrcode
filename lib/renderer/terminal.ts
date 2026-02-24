import type { QRCodeCreateResult } from "../core/qrcode";
import * as big from "./terminal/terminal.js";
import * as small from "./terminal/terminal-small.js";

export interface TerminalRendererOptions {
  small?: boolean;
  inverse?: boolean;
  margin?: number;
  scale?: number;
}

export function render(
  qrData: QRCodeCreateResult,
  options?: TerminalRendererOptions | undefined,
  cb?: (err: null, output: string) => void,
): string {
  if (options && options.small) {
    return small.render(qrData, options, cb);
  }
  return big.render(qrData, options, cb);
}
