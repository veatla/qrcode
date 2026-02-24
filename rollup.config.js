import terser from "@rollup/plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";

const babelConfig = {
  babelrc: false,
  presets: [
    ["@babel/preset-env", { targets: "defaults, IE >= 10, Safari >= 5.1" }],
  ],
};

export default [
  {
    input: "lib/browser.ts",
    output: [
      {
        file: "dist/qrcode.js",
        format: "iife",
        name: "QRCode",
        exports: "default",
      },
      {
        file: "dist/browser.js",
        format: "es",
        exports: "default",
      },
    ],
    plugins: [typescript(), resolve(), babel(babelConfig), terser()],
  },
  {
    input: "lib/browser.ts",
    output: {
      file: "dist/qrcode.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },

  {
    input: "lib/helper/to-sjis.ts",
    output: {
      file: "dist/qrcode.tosjis.js",
      format: "iife",
      name: "QRCodeToSJIS",
      exports: "default",
    },
    plugins: [typescript(), resolve(), babel(babelConfig), terser()],
  },
];
