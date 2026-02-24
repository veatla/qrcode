import { test } from "tap";
import { spy as _spy } from "sinon";
import { toFileStream } from "../../lib/index.js";
import StreamMock from "../mocks/writable-stream.js";

test("toFileStream png", function (t) {
  t.throws(function () {
    // @ts-expect-error - test error
    toFileStream("some text");
  }, "Should throw if stream is not provided");

  t.throws(function () {
    // @ts-expect-error - test error
    toFileStream(new StreamMock());
  }, "Should throw if text is not provided");

  const fstream = new StreamMock();
  const spy = _spy(fstream, "emit");

  toFileStream(fstream, "i am a pony!");

  toFileStream(fstream, "i am a pony!", {
    type: "image/png",
  });

  t.ok(spy.neverCalledWith("error"), "There should be no error");

  spy.restore();
  t.end();
});

test("toFileStream png with write error", function (t) {
  const fstreamErr = new StreamMock().forceErrorOnWrite();
  toFileStream(fstreamErr, "i am a pony!");

  t.plan(2);

  fstreamErr.on("error", function (e) {
    t.ok(e, "Should return an error");
  });
});

test("toFileStream png with qrcode error", function (t) {
  const fstreamErr = new StreamMock();
  const bigString = Array(200).join("i am a pony!");

  t.plan(2);

  fstreamErr.on("error", function (e) {
    t.ok(e, "Should return an error");
  });

  toFileStream(fstreamErr, bigString);
  toFileStream(fstreamErr, "i am a pony!", {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: "H",
  });
});
