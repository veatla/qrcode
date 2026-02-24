import { test } from "tap";
import { getOptions, getScale, getImageWidth, qrToImageData } from "../../../lib/renderer/utils.js";

test("Utils getOptions", function (t) {
  const defaultOptions = {
    width: undefined,
    scale: 4,
    margin: 4,
    color: {
      dark: { r: 0, g: 0, b: 0, a: 255, hex: "#000000" },
      light: { r: 255, g: 255, b: 255, a: 255, hex: "#ffffff" },
    },
    type: undefined,
    rendererOpts: {},
  };

  t.ok(getOptions, "getOptions should be defined");

  t.strictSame(
    getOptions(),
    defaultOptions,
    "Should return default options if called without param",
  );

  t.equal(getOptions({ scale: 8 }).scale, 8, "Should return correct scale value");

  t.equal(
    getOptions({ width: 300 }).scale,
    4,
    "Should reset scale value to default if width is set",
  );

  t.equal(
    getOptions({ margin: null }).margin,
    4,
    "Should return default margin if specified value is null",
  );

  t.equal(
    getOptions({ margin: -1 }).margin,
    4,
    "Should return default margin if specified value is < 0",
  );

  t.equal(getOptions({ margin: 20 }).margin, 20, "Should return correct margin value");

  t.strictSame(
    getOptions({ color: { dark: "#fff", light: "#000000" } }).color,
    {
      dark: { r: 255, g: 255, b: 255, a: 255, hex: "#ffffff" },
      light: { r: 0, g: 0, b: 0, a: 255, hex: "#000000" },
    },
    "Should return correct colors value from strings",
  );

  t.strictSame(
    // @ts-expect-error - test error
    getOptions({ color: { dark: 111, light: 999 } }).color,
    {
      dark: { r: 17, g: 17, b: 17, a: 255, hex: "#111111" },
      light: { r: 153, g: 153, b: 153, a: 255, hex: "#999999" },
    },
    "Should return correct colors value from numbers",
  );

  t.throws(function () {
    // @ts-expect-error - test error
    getOptions({ color: { dark: true } });
  }, "Should throw if color is not a string");

  t.throws(function () {
    getOptions({ color: { dark: "#aa" } });
  }, "Should throw if color is not in a valid hex format");

  t.end();
});

test("Utils getScale", function (t) {
  const symbolSize = 21;

  // @ts-expect-error - test error
  t.equal(getScale(symbolSize, { scale: 5 }), 5, "Should return correct scale value");

  t.equal(
    // @ts-expect-error - test error
    getScale(symbolSize, { width: 50, margin: 2 }),
    2,
    "Should calculate correct scale from width and margin",
  );

  t.equal(
    // @ts-expect-error - test error
    getScale(symbolSize, { width: 21, margin: 2, scale: 4 }),
    4,
    "Should return default scale if width is too small to contain the symbol",
  );

  t.end();
});

test("Utils getImageWidth", function (t) {
  const symbolSize = 21;

  t.equal(
    // @ts-expect-error - test error
    getImageWidth(symbolSize, { scale: 5, margin: 0 }),
    105,
    "Should return correct width value",
  );

  t.equal(
    // @ts-expect-error - test error
    getImageWidth(symbolSize, { width: 250, margin: 2 }),
    250,
    "Should return specified width value",
  );

  t.equal(
    // @ts-expect-error - test error
    getImageWidth(symbolSize, { width: 10, margin: 4, scale: 4 }),
    116,
    "Should ignore width option if too small to contain the symbol",
  );

  t.end();
});

test("Utils qrToImageData", function (t) {
  t.ok(qrToImageData, "qrToImageData should be defined");

  const sampleQrData = {
    modules: {
      data: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1],
      size: 4,
    },
  };

  const margin = 4;
  const scale = 2;
  const width = 100;

  const color = {
    dark: { r: 255, g: 255, b: 255, a: 255 },
    light: { r: 0, g: 0, b: 0, a: 255 },
  };

  const opts = {
    margin: margin,
    scale: scale,
    color: color,
  };

  let imageData = [];
  const expectedImageSize = (sampleQrData.modules.size + margin * 2) * scale;
  let expectedImageDataLength = Math.pow(expectedImageSize, 2) * 4;

  // @ts-expect-error - test error
  qrToImageData(imageData, sampleQrData, opts);

  t.equal(imageData.length, expectedImageDataLength, "Should return correct imageData length");

  imageData = [];
  // @ts-expect-error - test error
  opts.width = width;
  expectedImageDataLength = Math.pow(width, 2) * 4;

  // @ts-expect-error - test error
  qrToImageData(imageData, sampleQrData, opts);

  t.equal(imageData.length, expectedImageDataLength, "Should return correct imageData length");

  t.end();
});
