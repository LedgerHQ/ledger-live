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
var AGRS_exports = {};
__export(AGRS_exports, {
  default: () => AGRS_default
});
module.exports = __toCommonJS(AGRS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f49e00";
function AGRS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M14.816 13c1.684-2.638 2.996-7 2.996-7l-2.809.637-1.028 3.638c-.097-2.727-1.966-3.726-1.966-3.726-1.498-.73-2.833-.408-3.795.093-1.191.62-2.058 1.7-2.472 2.943-.59 1.77-.518 3.755-.44 4.653.032.422.125.837.278 1.233 1.033 2.68 3.896 2.527 3.896 2.527 2.623-.093 4.216-3.181 4.216-3.181l.752 2.27c.673 1.14 2.165.713 2.472.65.054-.013.102-.019.157-.03l1.677-.256v-.73c-3.651.099-3.934-3.72-3.934-3.72m-3.554 2.746c-.226.231-.51.397-.824.478-.68.17-1.203-.116-1.564-.466a2.95 2.95 0 01-.794-1.484c-.661-3.742.253-5.382.86-6.136a1.7 1.7 0 011.401-.648c2.358.123 2.888 5.056 2.888 5.056-.668 1.752-1.528 2.768-1.967 3.2" }));
}
AGRS.DefaultColor = DefaultColor;
var AGRS_default = AGRS;
//# sourceMappingURL=AGRS.js.map
