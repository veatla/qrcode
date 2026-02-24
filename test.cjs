const spawn = require("child_process").spawn;
const path = require("path");

const opt = {
  cwd: __dirname,
  env: (function () {
    process.env.NODE_PATH = "./" + path.delimiter + "./dist";
    process.env.TS_NODE_PROJECT = path.join(__dirname, "tsconfig.test.json");
    return process.env;
  })(),
  stdio: [process.stdin, process.stdout, process.stderr],
};

// Use tap's runner directly so it works on Windows (node_modules/.bin/tap is a shell script)
const tapRunner = path.join(__dirname, "node_modules", "tap", "dist", "esm", "run.mjs");

spawn(
  "node",
  [
    "-r",
    "ts-node/register",
    tapRunner,
    "--",
    "--cov",
    "--100",
    process.argv[2] || "test/**/*.test.ts",
  ],
  opt,
);
