import { test } from "tap";
import * as fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { stub } from "sinon";
import { toFile } from "../../lib/index.js";
import * as fileSystem from "../../lib/helper/fileSystem.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
import { removeNativePromise, restoreNativePromise } from "../helpers.js";
import StreamMock from "../mocks/writable-stream.js";

test("toFile - no promise available", function (t) {
  removeNativePromise();
  const fileName = join(tmpdir(), "qrimage.png");

  t.throws(function () {
    toFile(fileName, "some text");
  }, "Should throw if a callback is not provided");

  t.throws(function () {
    toFile(fileName, "some text", {});
  }, "Should throw if a callback is not a function");

  t.end();

  restoreNativePromise();
});

test("toFile", function (t) {
  const fileName = join(tmpdir(), "qrimage.png");

  t.throws(function () {
    // @ts-expect-error - test error
    toFile("some text", function () {});
  }, "Should throw if path is not provided");

  t.throws(function () {
    // @ts-expect-error - test error
    toFile(fileName);
  }, "Should throw if text is not provided");

  // @ts-expect-error - test error
  t.equal(typeof toFile(fileName, "some text").then, "function", "Should return a promise");

  t.end();
});

test("toFile png", function (t) {
  const fileName = join(tmpdir(), "qrimage.png");
  const expectedBase64Output =
    "iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKtSURBVO3BQW7EVgwFwX6E7n/ljnfh6gOCNI6HYVX8wRqjWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoFw8l4Tep3JGETqVLQqfSJeE3qTxRrFGKNUqxRrl4mcqbknCShE7lk1TelIQ3FWuUYo1SrFEuPiwJd6h8UhI6lSeScIfKJxVrlGKNUqxRLr6cyonKSRI6lW9WrFGKNUqxRrn4cklY/yrWKMUapVijXHyYyl+i8iaVv6RYoxRrlGKNcvGyJPyXVLoknCShUzlJwl9WrFGKNUqxRok/+GJJ6FT+z4o1SrFGKdYoFw8l4USlS0KncpKEE5WTJNyh0iXhDpUuCScqbyrWKMUapVijXDyk0iXhiSR0Kl0SuiR0KneodEnoVE6S0CWhU+mS0CWhU3miWKMUa5RijXLxUBI6lTuS0Kl0SThR6ZLwpiScqJwk4TcVa5RijVKsUS4eUumScKLSJaFLQqdykoQTlZMkdCpdEu5IQqdykoQ3FWuUYo1SrFHiDx5IwolKl4QnVLokdConSehUnkhCp/JfKtYoxRqlWKNcPKRyh8onJaFTuSMJd6h0SehUTpLQqTxRrFGKNUqxRrl4KAm/SeVE5Y4k3KHSJaFT6ZJwovKmYo1SrFGKNcrFy1TelIQTlS4JJypvUjlR6ZLwScUapVijFGuUiw9Lwh0qvykJJypvUvmkYo1SrFGKNcrFl0vCm1ROkvBJKk8Ua5RijVKsUS6+nEqXhE7lL1HpkvCmYo1SrFGKNcrFh6l8UhI6lTtUuiR0Kk+onKi8qVijFGuUYo1y8bIk/GVJ6FROktCpdEm4IwmdypuKNUqxRinWKPEHa4xijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKP8A74RAPtcmxy3AAAAAElFTkSuQmCCAElFTkSuQmCC";

  t.plan(7);

  toFile(
    fileName,
    "i am a pony!",
    {
      errorCorrectionLevel: "L",
    },
    function (err) {
      console.log(!err, true);
      // t.same(!err, true, "There should be no error");

      fs.stat(fileName, function (err) {
        t.ok(!err, "Should save file with correct file name");
      });

      fs.readFile(fileName, function (err, buffer) {
        if (err) throw err;

        t.equal(buffer.toString("base64"), expectedBase64Output, "Should write correct content");
      });
    },
  );

  toFile(
    fileName,
    "i am a pony!",
    {
      errorCorrectionLevel: "L",
      type: "png",
    },
    function (err) {
      t.ok(!err, "There should be no errors if file type is specified");
    },
  );

  toFile(fileName, "i am a pony!", {
    errorCorrectionLevel: "L",
    // @ts-expect-error - test error
  }).then(function () {
    fs.stat(fileName, function (err) {
      t.ok(!err, "Should save file with correct file name (promise)");
    });

    fs.readFile(fileName, function (err, buffer) {
      if (err) throw err;

      t.equal(
        buffer.toString("base64"),
        expectedBase64Output,
        "Should write correct content (promise)",
      );
    });
  });

  // const fsStub = stub(fileSystem, "createWriteStream");
  // fsStub.returns(new StreamMock().forceErrorOnWrite());

  toFile(
    fileName,
    "i am a pony!",
    {
      errorCorrectionLevel: "L",
      // @ts-expect-error
      createStream: () => new StreamMock().forceErrorOnWrite(),
    },
    function (err) {
      t.ok(err, "There should be an error");
    },
  );

  toFile(fileName, "i am a pony!", {
    errorCorrectionLevel: "L",
    // @ts-expect-error
    createStream: () => new StreamMock().forceErrorOnWrite(),
    // @ts-expect-error - test error
  }).catch(function (err) {
    t.ok(err, "Should catch an error (promise)");
  });

  // fsStub.restore();
});

test("toFile svg", function (t) {
  const fileName = join(tmpdir(), "qrimage.svg");
  const expectedOutput = fs.readFileSync(join(__dirname, "/svg.expected.out"), {
    encoding: "utf8",
  });

  t.plan(6);

  toFile(
    fileName,
    "http://www.google.com",
    {
      errorCorrectionLevel: "H",
    },
    function (err) {
      t.ok(!err, "There should be no error");

      fs.stat(fileName, function (err) {
        t.ok(!err, "Should save file with correct file name");
      });

      fs.readFile(fileName, "utf8", function (err, content) {
        if (err) throw err;
        t.equal(content, expectedOutput, "Should write correct content");
      });
    },
  );

  toFile(
    fileName,
    "http://www.google.com",
    {
      errorCorrectionLevel: "H",
      type: "svg",
    },
    function (err) {
      t.ok(!err, "There should be no errors if file type is specified");
    },
  );

  toFile(fileName, "http://www.google.com", {
    errorCorrectionLevel: "H",
    // @ts-expect-error - test error
  }).then(function () {
    fs.stat(fileName, function (err) {
      t.ok(!err, "Should save file with correct file name (promise)");
    });

    fs.readFile(fileName, "utf8", function (err, content) {
      if (err) throw err;
      t.equal(content, expectedOutput, "Should write correct content (promise)");
    });
  });
});

test("toFile utf8", function (t) {
  const fileName = join(tmpdir(), "qrimage.txt");
  const expectedOutput = [
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

  t.plan(6);

  toFile(fileName, "http://www.google.com", function (err) {
    t.ok(!err, "There should be no error");

    fs.stat(fileName, function (err) {
      t.ok(!err, "Should save file with correct file name");
    });

    fs.readFile(fileName, "utf8", function (err, content) {
      if (err) throw err;
      t.equal(content, expectedOutput, "Should write correct content");
    });
  });

  toFile(
    fileName,
    "http://www.google.com",
    {
      errorCorrectionLevel: "M",
      type: "utf8",
    },
    function (err) {
      t.ok(!err, "There should be no errors if file type is specified");
    },
  );

  // @ts-expect-error - test error
  toFile(fileName, "http://www.google.com").then(function () {
    fs.stat(fileName, function (err) {
      t.ok(!err, "Should save file with correct file name (promise)");
    });

    fs.readFile(fileName, "utf8", function (err, content) {
      if (err) throw err;
      t.equal(content, expectedOutput, "Should write correct content (promise)");
    });
  });
});

test("toFile manual segments", function (t) {
  const fileName = join(tmpdir(), "qrimage.txt");
  const segs = [
    { data: "ABCDEFG", mode: "alphanumeric" },
    { data: "0123456", mode: "numeric" },
  ];
  const expectedOutput = [
    "                             ",
    "                             ",
    "    █▀▀▀▀▀█ ██▀██ █▀▀▀▀▀█    ",
    "    █ ███ █  █▀█▄ █ ███ █    ",
    "    █ ▀▀▀ █ █ ▄ ▀ █ ▀▀▀ █    ",
    "    ▀▀▀▀▀▀▀ █▄█▄▀ ▀▀▀▀▀▀▀    ",
    "    ▀▀█▄ ▀▀▄█▀▀▀▀██▀▀▄ █▀    ",
    "    ▀ ▀█▀█▀█▄ ▄ ▄█▀▀▀█▀      ",
    "    ▀▀ ▀▀ ▀ ▄▀ ▄ ▄▀▄  ▀▄     ",
    "    █▀▀▀▀▀█ ▄  █▀█ ▀▀▀▄█▄    ",
    "    █ ███ █  █▀▀▀ ██▀▀ ▀▀    ",
    "    █ ▀▀▀ █ ██  ▄▀▀▀▀▄▀▀█    ",
    "    ▀▀▀▀▀▀▀ ▀    ▀▀▀▀ ▀▀▀    ",
    "                             ",
    "                             ",
  ].join("\n");
  t.plan(3);

  toFile(
    fileName,
    // @ts-expect-error - test error
    segs,
    {
      errorCorrectionLevel: "L",
    },
    function (err) {
      t.ok(!err, "There should be no errors if text is not string");

      fs.stat(fileName, function (err) {
        t.ok(!err, "Should save file with correct file name");
      });

      fs.readFile(fileName, "utf8", function (err, content) {
        if (err) throw err;
        t.equal(content, expectedOutput, "Should write correct content");
      });
    },
  );
});
