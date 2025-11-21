import type { QRCodeResult } from "../core/qrcode";
import type { Options, QrCodeCallback } from "../server";
import { render } from "./terminal/terminal";
import { render as _render } from "./terminal/terminal-small";
import type { RendererTypes } from "./types";

class TerminalRendererClass implements RendererTypes<string> {
    renderToFile(path: unknown, qrData: unknown, options: unknown, cb: unknown): void {
        throw new Error("Method not implemented.");
    }
    renderToBuffer(qrData: unknown, options: unknown, cb: unknown): void {
        throw new Error("Method not implemented.");
    }
    renderToDataURL(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined): void {
        throw new Error("Method not implemented.");
    }
    render(qrData: QRCodeResult, options?: Options, cb?: QrCodeCallback) {
        if (options && options.small) {
            return _render(qrData, options, cb);
        }
        return render(qrData, options, cb);
    }
}

const TerminalRenderer = new TerminalRendererClass();

export default TerminalRenderer;
