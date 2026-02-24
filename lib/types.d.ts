/** Error correction level */
export interface ECLevel {
  bit: number;
}

/** Encoding mode */
export interface Mode {
  id?: string;
  bit: number;
  ccBits?: [number, number, number];
}

/** Options for QRCode.create() */
export interface QRCodeOptions {
  version?: number;
  errorCorrectionLevel?: string | ECLevel;
  maskPattern?: number;
  toSJISFunc?: (codePoint: number) => number;
  type?: "png" | "svg" | "utf8" | "txt" | "image/png";
}
