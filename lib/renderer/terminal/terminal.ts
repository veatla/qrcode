import type { QRCodeCreateResult } from "../../core/qrcode";

export function render(
  qrData: QRCodeCreateResult,
  options: unknown,
  cb?: (err: null, output: string) => void,
): string {
  const size = qrData.modules.size;
  const data = qrData.modules.data;

  const black = "\x1b[40m  \x1b[0m";
  const white = "\x1b[47m  \x1b[0m";

  let output = "";
  const hMargin = Array(size + 3).join(white);
  const vMargin = Array(2).join(white);

  output += hMargin + "\n";
  for (let i = 0; i < size; ++i) {
    output += white;
    for (let j = 0; j < size; j++) {
      output += data[i * size + j] ? black : white;
    }
    output += vMargin + "\n";
  }

  output += hMargin + "\n";

  if (typeof cb === "function") {
    cb(null, output);
  }

  return output;
}
