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
var TOMO_exports = {};
__export(TOMO_exports, {
  default: () => TOMO_default
});
module.exports = __toCommonJS(TOMO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1a1f36";
function TOMO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M13.75 10.573a.411.411 0 00.037-.82h-2.88v-.72a.476.476 0 00-.915 0v.72h-.77a.41.41 0 000 .82h.77v2.505a2.39 2.39 0 002.383 2.376 2.33 2.33 0 001.44-.525l.173-.144a.483.483 0 10-.633-.72l-.13.108a1.38 1.38 0 01-1.498.172 1.44 1.44 0 01-.82-1.296v-2.476zm4.68 2.793a.36.36 0 00-.28-.425h-.18a.35.35 0 00-.345.274 5.616 5.616 0 11-10.6-3.55 5.13 5.13 0 012.78-2.779 5.66 5.66 0 016.998 2.002.36.36 0 00.49.1l.065-.043a.39.39 0 00.123-.532 6.48 6.48 0 00-7.596-2.44A6.08 6.08 0 006.14 9.664a6.436 6.436 0 1012.29 3.701m-5.917-9.929h-.72a8.582 8.582 0 00-7.878 10.98.41.41 0 00.511.274h.058a.41.41 0 00.216-.482 7.762 7.762 0 115.76 5.4.39.39 0 00-.39.144.42.42 0 00.238.67 8.575 8.575 0 102.205-16.986" }));
}
TOMO.DefaultColor = DefaultColor;
var TOMO_default = TOMO;
//# sourceMappingURL=TOMO.js.map
