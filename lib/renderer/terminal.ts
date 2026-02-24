import type { QRCodeCreateResult } from "../core/qrcode";
import * as big from "./terminal/terminal";
import * as small from "./terminal/terminal-small";

export interface TerminalRendererOptions {
  small?: boolean;
  inverse?: boolean;
}

export function render(
  qrData: QRCodeCreateResult,
  options: TerminalRendererOptions | undefined,
  cb?: (err: null, output: string) => void,
): string {
  if (options && options.small) {
    return small.render(qrData, options, cb);
  }
  return big.render(qrData, options, cb);
}
