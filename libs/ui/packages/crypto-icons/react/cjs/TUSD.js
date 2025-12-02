"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var TUSD_exports = {};
__export(TUSD_exports, {
  default: () => TUSD_default
});
module.exports = __toCommonJS(TUSD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2b2e7f";
function TUSD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.79 14.577v-4.395h.578c1.909 0 2.38-1.78 2.38-1.78h-5.013c-2.379 0-2.782 1.781-2.782 1.781h2.957v6.613s1.88-.565 1.88-2.219" }), /* @__PURE__ */ React.createElement("path", { d: "M18.294 18.002c1.686-1.752 2.333-4.185 1.726-6.512a7 7 0 00-1.86-3.21c-.081-.08-.162-.161-.256-.24l-.081-.08a2 2 0 00-.176-.148l-.108-.08-.161-.12-.096-.067a3 3 0 01-.188-.134l-.122-.08a1 1 0 00-.161-.093l-.122-.08c-.054-.027-.108-.068-.162-.094l-.121-.068c-.054-.026-.108-.053-.176-.08l-.041-.013a6.563 6.563 0 01.431 9.708c-3.29 3.263-8.629 3.263-11.92 0-.121-.12-.229-.24-.35-.36l-.094-.107a4 4 0 01-.203-.254 8.9 8.9 0 001.632 2.246c3.438 3.41 9.02 3.41 12.458 0a.5.5 0 00.151-.135" }), /* @__PURE__ */ React.createElement("path", { d: "M7.798 17.096a6 6 0 01-.432-.388 6.567 6.567 0 010-9.33c3.293-3.265 8.637-3.265 11.93 0q.344.343.648.724a8.8 8.8 0 00-1.633-2.235c-3.441-3.413-9.029-3.413-12.47 0-.04.04-.08.094-.135.133-2.28 2.383-2.591 5.943-.769 8.647a7.2 7.2 0 002.861 2.449" }));
}
TUSD.DefaultColor = DefaultColor;
var TUSD_default = TUSD;
//# sourceMappingURL=TUSD.js.map
