import type { QRCodeResult } from "../core/qrcode";
import type { Options, QrCodeCallback } from "../server";

export interface RendererTypes<RenderType> {
    render(qrData: QRCodeResult, options?: Options): RenderType;
    renderToFile(path: string, qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined): void;
    renderToBuffer(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | undefined): void;
    renderToFile(path: string, qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined): void;
    renderToBuffer(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | undefined): void;
    renderToDataURL(qrData: QRCodeResult, options: Options | undefined, cb: QrCodeCallback | Options | undefined): void;
}
