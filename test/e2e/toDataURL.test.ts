import { test } from "tap";
import { toDataURL } from "../../lib/index.js";
import Browser from "../../lib/browser.js";
import { createCanvas } from "canvas";
import { removeNativePromise, restoreNativePromise } from "../helpers.js";
import { writeFile } from "fs";
import { join } from "path";

test("toDataURL - no promise available", function (t) {
  removeNativePromise();

  t.throws(function () {
    // @ts-expect-error - test error
    toDataURL();
  }, "Should throw if no arguments are provided");

  t.throws(function () {
    // @ts-expect-error - test error
    toDataURL(function () {});
  }, "Should throw if text is not provided");

  t.throws(function () {
    toDataURL("some text");
  }, "Should throw if a callback is not provided");

  t.throws(function () {
    toDataURL("some text", {});
  }, "Should throw if a callback is not a function");

  t.throws(function () {
    // @ts-expect-error - test error
    Browser.toDataURL();
  }, "Should throw if no arguments are provided (browser)");

  t.throws(function () {
    // @ts-expect-error - test error
    Browser.toDataURL(function () {});
  }, "Should throw if text is not provided (browser)");

  t.throws(function () {
    Browser.toDataURL("some text");
  }, "Should throw if a callback is not provided (browser)");

  t.throws(function () {
    Browser.toDataURL("some text", {});
  }, "Should throw if a callback is not a function (browser)");

  t.end();

  restoreNativePromise();
});

test("toDataURL - image/png", function (t) {
  const expectedDataURL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKtSURBVO3BQW7EVgwFwX6E7n/ljnfh6gOCNI6HYVX8wRqjWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoFw8l4Tep3JGETqVLQqfSJeE3qTxRrFGKNUqxRrl4mcqbknCShE7lk1TelIQ3FWuUYo1SrFEuPiwJd6h8UhI6lSeScIfKJxVrlGKNUqxRLr6cyonKSRI6lW9WrFGKNUqxRrn4cklY/yrWKMUapVijXHyYyl+i8iaVv6RYoxRrlGKNcvGyJPyXVLoknCShUzlJwl9WrFGKNUqxRok/+GJJ6FT+z4o1SrFGKdYoFw8l4USlS0KncpKEE5WTJNyh0iXhDpUuCScqbyrWKMUapVijXDyk0iXhiSR0Kl0SuiR0KneodEnoVE6S0CWhU+mS0CWhU3miWKMUa5RijXLxUBI6lTuS0Kl0SThR6ZLwpiScqJwk4TcVa5RijVKsUS4eUumScKLSJaFLQqdykoQTlZMkdCpdEu5IQqdykoQ3FWuUYo1SrFHiDx5IwolKl4QnVLokdConSehUnkhCp/JfKtYoxRqlWKNcPKRyh8onJaFTuSMJd6h0SehUTpLQqTxRrFGKNUqxRrl4KAm/SeVE5Y4k3KHSJaFT6ZJwovKmYo1SrFGKNcrFy1TelIQTlS4JJypvUjlR6ZLwScUapVijFGuUiw9Lwh0qvykJJypvUvmkYo1SrFGKNcrFl0vCm1ROkvBJKk8Ua5RijVKsUS6+nEqXhE7lL1HpkvCmYo1SrFGKNcrFh6l8UhI6lTtUuiR0Kk+onKi8qVijFGuUYo1y8bIk/GVJ6FROktCpdEm4IwmdypuKNUqxRinWKPEHa4xijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKP8A74RAPtcmxy3AAAAAElFTkSuQmCC";

  t.plan(8);

  t.throws(function () {
    // @ts-expect-error - test error
    toDataURL();
  }, "Should throw if no arguments are provided");

  toDataURL(
    "i am a pony!",
    {
      errorCorrectionLevel: "L",
      type: "image/png",
    },
    function (err, url) {
      t.ok(!err, "there should be no error " + err);
      t.equal(url, expectedDataURL, "url should match expected value for error correction L");
    },
  );

  toDataURL(
    "i am a pony!",
    {
      version: 1, // force version=1 to trigger an error
      errorCorrectionLevel: "H",
      type: "image/png",
    },
    function (err, url) {
      t.ok(err, "there should be an error ");
      t.notOk(url, "url should be null");
    },
  );

  // @ts-expect-error - test error
  t.equal(typeof toDataURL("i am a pony!").then, "function", "Should return a promise");

  toDataURL("i am a pony!", {
    errorCorrectionLevel: "L",
    type: "image/png",
    // @ts-expect-error - test error
  }).then(function (url) {
    t.equal(
      url,
      expectedDataURL,
      "url should match expected value for error correction L (promise)",
    );
  });

  toDataURL("i am a pony!", {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: "H",
    type: "image/png",
    // @ts-expect-error - test error
  }).catch(function (err) {
    t.ok(err, "there should be an error (promise)");
  });
});

test("Canvas toDataURL - image/png", function (t) {
  const expectedDataURL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAABmJLR0QA/wD/AP+gvaeTAAAC2ElEQVR4nO3dS27jMBAFwNFg7n9lZ5PN44ZDsJu0gKptlMgxHtptip/n8/l8/sCvv7dfAN9FIAgCQRAIgkAQBIIgEASBIAgEQSAIAkEQCIJAEASCIBCEf7t/4Hmeitfx38bpG+P9d6d3rP692fW3359VKgRBIAgCQdjuIUbVUzRnn8Grn/G7dnuW0+/PKhWCIBAEgSCU9xCj1c+47nGE3XGD2z1A9zIaFYIgEASBILT3EN12e4bR7rOIty+VVSEIAkEQCMLre4ju+RGnn5XcpkIQBIIgEIT2HuLbvpevPquY9STdPcppKgRBIAgCQSjvIU5/L++e/7B7/9n130aFIAgEQSAI2z3E7e/Rq/MbVn++6/b7s0qFIAgEQSAIT/d5GdXjANXrKLrHEVbf3ur9KVapEASBIAgE4fqcyur5BKf3g5jdr3sPrGoqBEEgCAJBaN+n8vT8hN11GtXjIqdfzy4VgiAQBIEglD/LOP3sons/h90eafX6088uRioEQSAIAkEoH4e4ve5hdPvZw0z1/2M+BKUEgiAQhPJ1GdVj+aPdOZTde19391DdVAiCQBAEgnB8HOL2/Ifq++1e370uZZUKQRAIgkAQrs+H6B4X6D7Lu3rt5ulnKSMVgiAQBIEgbPcQ3edgds857H62sur2nlQqBEEgCAJBaN9jqlv1Wd2nn3V0r/tYpUIQBIIgEIT2/SGq7Z55VX2GVvU6j+75DjMqBEEgCAJBKN+nsnpYY/UzetTdc8x078NpfwhaCQRBIAjte113ny8x+/3uOZWz338bFYIgEASBIFw/L2PX6XUdq1Z7Fusy+CoCQRAIwut7iOq1oqfP5Vy93j6VHCUQBIEgtPcQp/eKPj1uMPt5976Z5kPQSiAIAkEo3x+i2+mzs2+f87l6P+MQlBIIgkAQXr8/BLVUCIJAEASCIBAEgSAIBEEgCAJBEAiCQBAEgiAQBIEgCARBIAg/iJPE+NX8w4QAAAAASUVORK5CYII=";

  t.plan(11);

  t.throws(function () {
    // @ts-expect-error - test error
    Browser.toDataURL();
  }, "Should throw if no arguments are provided");

  t.throws(function () {
    // @ts-expect-error - test error
    Browser.toDataURL(function () {});
  }, "Should throw if text is not provided");

  const canvas = createCanvas(200, 200);
  Browser.toDataURL(
    // @ts-expect-error - test error
    canvas,
    "i am a pony!",
    {
      errorCorrectionLevel: "H",
      type: "image/png",
    },
    function (err, url) {
      t.ok(!err, "there should be no error " + err);
      t.equal(url, expectedDataURL, "url generated should match expected value");
    },
  );

  Browser.toDataURL(
    // @ts-expect-error - test error
    canvas,
    "i am a pony!",
    {
      version: 1, // force version=1 to trigger an error
      errorCorrectionLevel: "H",
      type: "image/png",
    },
    function (err, url) {
      t.ok(err, "there should be an error ");
      t.notOk(url, "url should be null");
    },
  );

  // @ts-expect-error - test error
  Browser.toDataURL(canvas, "i am a pony!", {
    errorCorrectionLevel: "H",
    type: "image/png",
  }).then(function (url) {
    t.equal(url, expectedDataURL, "url generated should match expected value (promise)");
  });

  // @ts-expect-error - test error
  Browser.toDataURL(canvas, "i am a pony!", {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: "H",
    type: "image/png",
  }).catch(function (err) {
    t.ok(err, "there should be an error (promise)");
  });

  // Mock document object
  global.document = {
    // @ts-expect-error - test error
    createElement: function (el) {
      if (el === "canvas") {
        return createCanvas(200, 200);
      }
    },
  };

  // @ts-expect-error - test error
  Browser.toDataURL(
    "i am a pony!",
    {
      errorCorrectionLevel: "H",
      type: "image/png",
    },
    function (err, url) {
      t.ok(!err, "there should be no error " + err);
      t.equal(url, expectedDataURL, "url generated should match expected value");
    },
  );

  // @ts-expect-error - test error
  Browser.toDataURL("i am a pony!", {
    errorCorrectionLevel: "H",
    type: "image/png",
  }).then(function (url) {
    t.equal(url, expectedDataURL, "url generated should match expected value (promise)");
  });
});
