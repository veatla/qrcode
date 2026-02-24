import { test } from "tap";
import { Canvas, createCanvas } from "canvas";
import { toCanvas } from "../../lib/index.js";
import { removeNativePromise, restoreNativePromise } from "../helpers.js";

test("toCanvas - no promise available", function (t) {
  removeNativePromise();

  // Mock document object
  global.document = {
    // @ts-expect-error - test error
    createElement: function (el) {
      if (el === "canvas") {
        return createCanvas(200, 200);
      }
    },
  };
  const canvasEl = createCanvas(200, 200);

  t.throws(function () {
    // @ts-expect-error - test error
    toCanvas();
  }, "Should throw if no arguments are provided");

  t.throws(function () {
    toCanvas("some text");
  }, "Should throw if a callback is not provided");

  t.throws(function () {
    // @ts-expect-error - test error
    toCanvas(canvasEl, "some text");
  }, "Should throw if a callback is not provided");

  t.throws(function () {
    // @ts-expect-error - test error
    toCanvas(canvasEl, "some text", {});
  }, "Should throw if callback is not a function");

  t.end();

  global.document = undefined;
  restoreNativePromise();
});

test("toCanvas", function (t) {
  // Mock document object
  global.document = {
    // @ts-expect-error - test error
    createElement: function (el) {
      if (el === "canvas") {
        return createCanvas(200, 200);
      }
    },
  };

  t.plan(7);

  t.throws(function () {
    // @ts-expect-error - test error
    toCanvas();
  }, "Should throw if no arguments are provided");

  toCanvas("some text", function (err, canvasEl) {
    t.ok(!err, "There should be no error");
    t.ok(canvasEl instanceof Canvas, "Should return a new canvas object");
  });

  // @ts-expect-error - test error
  toCanvas(
    "some text",
    {
      errorCorrectionLevel: "H",
    },
    function (err, canvasEl) {
      t.ok(!err, "There should be no error");
      t.ok(canvasEl instanceof Canvas, "Should return a new canvas object");
    },
  );

  toCanvas("some text").then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas, "Should return a new canvas object (promise)");
  });

  // @ts-expect-error - test error
  toCanvas("some text", {
    errorCorrectionLevel: "H",
  }).then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas, "Should return a new canvas object (promise)");
  });

  global.document = undefined;
});

test("toCanvas with specified canvas element", function (t) {
  const canvasEl = createCanvas(200, 200);

  t.plan(6);

  // @ts-expect-error - test error
  toCanvas(canvasEl, "some text", function (err, canvasEl) {
    t.ok(!err, "There should be no error");
    t.ok(canvasEl instanceof Canvas, "Should return a new canvas object");
  });

  toCanvas(
    // @ts-expect-error - test error
    canvasEl,
    "some text",
    {
      errorCorrectionLevel: "H",
    },
    function (err, canvasEl) {
      t.ok(!err, "There should be no error");
      t.ok(canvasEl instanceof Canvas, "Should return a new canvas object");
    },
  );

  // @ts-expect-error - test error
  toCanvas(canvasEl, "some text").then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas, "Should return a new canvas object (promise)");
  });

  // @ts-expect-error - test error
  toCanvas(canvasEl, "some text", {
    errorCorrectionLevel: "H",
  }).then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas, "Should return a new canvas object (promise)");
  });
});
