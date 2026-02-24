import { test } from "tap";
import { readFile, readFileSync, write, writeFile } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { toString } from "../../lib/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
import QRCode from "../../lib/browser.js";
import { removeNativePromise, restoreNativePromise } from "../helpers.js";

test("toString - no promise available", function (t) {
  removeNativePromise();

  t.throws(function () {
    // @ts-expect-error - test error
    toString();
  }, "Should throw if text is not provided");

  t.throws(function () {
    toString("some text");
  }, "Should throw if a callback is not provided");

  t.throws(function () {
    toString("some text", {});
  }, "Should throw if a callback is not a function");

  t.throws(function () {
    // @ts-expect-error - test error
    toString();
  }, "Should throw if text is not provided (browser)");

  t.throws(function () {
    QRCode.toString("some text");
  }, "Should throw if a callback is not provided (browser)");

  t.throws(function () {
    QRCode.toString("some text", {});
  }, "Should throw if a callback is not a function (browser)");

  t.end();

  restoreNativePromise();
});

test("toString", function (t) {
  t.plan(5);

  t.throws(function () {
    // @ts-expect-error - test error
    toString();
  }, "Should throw if text is not provided");

  toString("some text", function (err, str) {
    t.ok(!err, "There should be no error");
    t.equal(typeof str, "string", "Should return a string");
  });

  // @ts-expect-error - test error
  t.equal(typeof toString("some text").then, "function", "Should return a promise");

  // @ts-expect-error - test error
  toString("some text", { errorCorrectionLevel: "L" }).then(function (str) {
    t.equal(typeof str, "string", "Should return a string");
  });
});

test("toString (browser)", function (t) {
  t.plan(5);

  t.throws(function () {
    // @ts-expect-error - test error
    QRCode.toString();
  }, "Should throw if text is not provided");

  QRCode.toString("some text", function (err, str) {
    t.ok(!err, "There should be no error (browser)");
    t.equal(typeof str, "string", "Should return a string (browser)");
  });

  t.equal(typeof QRCode.toString("some text").then, "function", "Should return a promise");

  // @ts-expect-error - test error
  QRCode.toString("some text", { errorCorrectionLevel: "L" }).then(function (str) {
    t.equal(typeof str, "string", "Should return a string");
  });
});

test("toString svg", function (t) {
  const file = join(__dirname, "/svgtag.expected.out");
  t.plan(6);

  toString(
    "http://www.google.com",
    {
      version: 1, // force version=1 to trigger an error
      errorCorrectionLevel: "H",
      type: "svg",
    },
    function (err, code) {
      t.ok(err, "there should be an error ");
      t.notOk(code, "string should be null");
    },
  );

  readFile(file, "utf8", function (err, expectedSvg) {
    if (err) throw err;

    toString(
      "http://www.google.com",
      {
        errorCorrectionLevel: "H",
        type: "svg",
      },
      function (err, code) {
        t.ok(!err, "There should be no error");
        t.equal(code, expectedSvg, "should output a valid svg");
      },
    );
  });

  toString("http://www.google.com", {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: "H",
    type: "svg",
    // @ts-expect-error - test error
  }).catch(function (err) {
    t.ok(err, "there should be an error (promise)");
  });

  readFile(file, "utf8", function (err, expectedSvg) {
    if (err) throw err;

    toString("http://www.google.com", {
      errorCorrectionLevel: "H",
      type: "svg",
      // @ts-expect-error - test error
    }).then(function (code) {
      t.equal(code, expectedSvg, "should output a valid svg (promise)");
    });
  });
});

test("toString browser svg", function (t) {
  const file = join(__dirname, "/svgtag.expected.out");

  t.plan(3);

  readFile(file, "utf8", function (err, expectedSvg) {
    if (err) throw err;

    // @ts-expect-error - test error
    QRCode.toString(
      "http://www.google.com",
      {
        errorCorrectionLevel: "H",
        type: "svg",
      },
      function (err, code) {
        t.ok(!err, "There should be no error");
        t.equal(code, expectedSvg, "should output a valid svg");
      },
    );

    // @ts-expect-error - test error
    QRCode.toString("http://www.google.com", {
      errorCorrectionLevel: "H",
      type: "svg",
    }).then(function (code) {
      t.equal(code, expectedSvg, "should output a valid svg (promise)");
    });
  });
});

test("toString utf8", function (t) {
  const expectedUtf8 = [
    "                                 ",
    "                                 ",
    "    █▀▀▀▀▀█ █ ▄█  ▀ █ █▀▀▀▀▀█    ",
    "    █ ███ █ ▀█▄▀▄█ ▀▄ █ ███ █    ",
    "    █ ▀▀▀ █ ▀▄ ▄ ▄▀ █ █ ▀▀▀ █    ",
    "    ▀▀▀▀▀▀▀ ▀ ▀ █▄▀ █ ▀▀▀▀▀▀▀    ",
    "    █▄ ██▀▀█▀▀█▄ ▄█▄▀█ ▄█▄██▀    ",
    "    █ █ ▀▀▀▄▄█ █▀▀▄█▀ ▀█ █▄▄█    ",
    "    ██▄▄▄▄▀█▄▄  ▀ ▄██▀▀ ▄  ▄▀    ",
    "    █▀▄▀ ▄▀▀█▀▀█▀▀▀█ ▀ ▄█▀█▀█    ",
    "    ▀ ▀▀ ▀▀▀███▄▄▄▀ █▀▀▀█ ▀█     ",
    "    █▀▀▀▀▀█ █▀█▀▄ ▄▄█ ▀ █▀ ▄█    ",
    "    █ ███ █ █ █ ▀▀██▀███▀█ ██    ",
    "    █ ▀▀▀ █  █▀ ▀ █ ▀▀▄██ ███    ",
    "    ▀▀▀▀▀▀▀ ▀▀▀  ▀▀ ▀    ▀  ▀    ",
    "                                 ",
    "                                 ",
  ].join("\n");

  t.plan(9);

  toString(
    "http://www.google.com",
    {
      version: 1, // force version=1 to trigger an error
      errorCorrectionLevel: "H",
      type: "utf8",
    },
    function (err, code) {
      t.ok(err, "there should be an error ");
      t.notOk(code, "string should be null");
    },
  );

  toString(
    "http://www.google.com",
    {
      errorCorrectionLevel: "M",
      type: "utf8",
    },
    function (err, code) {
      t.ok(!err, "There should be no error");
      t.equal(code, expectedUtf8, "should output a valid symbol");
    },
  );

  toString("http://www.google.com", function (err, code) {
    t.ok(!err, "There should be no error");
    t.equal(code, expectedUtf8, "Should output a valid symbol with default options");
  });

  toString("http://www.google.com", {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: "H",
    type: "utf8",
    // @ts-expect-error - test error
  }).catch(function (err) {
    t.ok(err, "there should be an error (promise)");
  });

  toString("http://www.google.com", {
    errorCorrectionLevel: "M",
    type: "utf8",
    // @ts-expect-error - test error
  }).then(function (code) {
    t.equal(code, expectedUtf8, "should output a valid symbol (promise)");
  });

  // @ts-expect-error - test error
  toString("http://www.google.com").then(function (code) {
    writeFile(join(__dirname, "/utf8.expected.out"), code + "\n", "utf8", function (err) {
      if (err) throw err;
    });
    t.equal(code, expectedUtf8, "Should output a valid symbol with default options (promise)");
  });
});

test("toString terminal", function (t) {
  const expectedTerminal = readFileSync(join(__dirname, "/terminal.expected.out")) + "";

  t.plan(3);

  toString(
    "http://www.google.com",
    {
      errorCorrectionLevel: "M",
      // @ts-expect-error - test error
      type: "terminal",
    },
    function (err, code) {
      t.ok(!err, "There should be no error");

      t.equal(code + "\n", expectedTerminal, "should output a valid symbol");
    },
  );

  toString("http://www.google.com", {
    errorCorrectionLevel: "M",
    // @ts-expect-error - test error
    type: "terminal",
    // @ts-expect-error - test error
  }).then(function (code) {
    t.equal(code + "\n", expectedTerminal, "should output a valid symbol (promise)");
  });
});

test("toString byte-input", function (t) {
  const expectedOutput = [
    "                             ",
    "                             ",
    "    █▀▀▀▀▀█  █▄█▀ █▀▀▀▀▀█    ",
    "    █ ███ █ ▀█ █▀ █ ███ █    ",
    "    █ ▀▀▀ █   ▀ █ █ ▀▀▀ █    ",
    "    ▀▀▀▀▀▀▀ █▄▀▄█ ▀▀▀▀▀▀▀    ",
    "    ▀█▀ ▀█▀▀▀█▀▀ ▀█  ▄▀▄     ",
    "    ▀▄ ▄▀▄▀▄ ██ ▀ ▄ ▀▄  ▀    ",
    "    ▀ ▀ ▀▀▀▀█▄ ▄▀▄▀▄▀▄▀▄▀    ",
    "    █▀▀▀▀▀█ █  █▄█▀█▄█  ▀    ",
    "    █ ███ █ ▀█▀▀ ▀██  ▀█▀    ",
    "    █ ▀▀▀ █ ██▀ ▀ ▄ ▀▄▀▄▀    ",
    "    ▀▀▀▀▀▀▀ ▀▀▀ ▀ ▀▀▀ ▀▀▀    ",
    "                             ",
    "                             ",
  ].join("\n");
  const byteInput = new Uint8ClampedArray([1, 2, 3, 4, 5]);

  t.plan(2);

  // @ts-expect-error - test error
  toString([{ data: byteInput, mode: "byte" }], { errorCorrectionLevel: "L" }, (err, code) => {
    t.ok(!err, "there should be no error");
    t.equal(code, expectedOutput, "should output the correct code");
  });
});
