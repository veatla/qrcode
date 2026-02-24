import type { QRCodeCreateResult } from "../../core/qrcode";

const backgroundWhite = "\x1b[47m";
const backgroundBlack = "\x1b[40m";
const foregroundWhite = "\x1b[37m";
const foregroundBlack = "\x1b[30m";
const reset = "\x1b[0m";
const lineSetupNormal = backgroundWhite + foregroundBlack;
const lineSetupInverse = backgroundBlack + foregroundWhite;

type Palette = Record<string, string>;

const createPalette = function (
  lineSetup: string,
  foregroundWhite: string,
  foregroundBlack: string,
): Palette {
  return {
    "00": reset + " " + lineSetup,
    "01": reset + foregroundWhite + "▄" + lineSetup,
    "02": reset + foregroundBlack + "▄" + lineSetup,
    "10": reset + foregroundWhite + "▀" + lineSetup,
    "11": " ",
    "12": "▄",
    "20": reset + foregroundBlack + "▀" + lineSetup,
    "21": "▀",
    "22": "█",
  };
};

const mkCodePixel = function (
  modules: Uint8Array,
  size: number,
  x: number,
  y: number,
): "0" | "1" | "2" {
  const sizePlus = size + 1;
  if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return "0";
  if (x >= size || y >= size || y < 0 || x < 0) return "1";
  const idx = y * size + x;
  return modules[idx] ? "2" : "1";
};

const mkCode = function (
  modules: Uint8Array,
  size: number,
  x: number,
  y: number,
): keyof Palette {
  return (mkCodePixel(modules, size, x, y) +
    mkCodePixel(modules, size, x, y + 1)) as keyof Palette;
};

export interface TerminalOptions {
  inverse?: boolean;
}

export function render(
  qrData: QRCodeCreateResult,
  options: TerminalOptions | undefined,
  cb?: (err: null, output: string) => void,
): string {
  const size = qrData.modules.size;
  const data = qrData.modules.data;

  const inverse = !!(options && options.inverse);
  const lineSetup =
    options && options.inverse ? lineSetupInverse : lineSetupNormal;
  const white = inverse ? foregroundBlack : foregroundWhite;
  const black = inverse ? foregroundWhite : foregroundBlack;

  const palette = createPalette(lineSetup, white, black);
  const newLine = reset + "\n" + lineSetup;

  let output = lineSetup;

  for (let y = -1; y < size + 1; y += 2) {
    for (let x = -1; x < size; x++) {
      output += palette[mkCode(data, size, x, y)];
    }

    output += palette[mkCode(data, size, size, y)] + newLine;
  }

  output += reset;

  if (typeof cb === "function") {
    cb(null, output);
  }

  return output;
}
