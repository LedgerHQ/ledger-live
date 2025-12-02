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
var NEAR_exports = {};
__export(NEAR_exports, {
  default: () => NEAR_default
});
module.exports = __toCommonJS(NEAR_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function NEAR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.448 3.914L13.685 9.5a.4.4 0 00.594.525l3.704-3.213a.15.15 0 01.25.114v10.058a.15.15 0 01-.265.096L6.773 3.679A1.92 1.92 0 005.309 3h-.391A1.92 1.92 0 003 4.917v14.165A1.92 1.92 0 004.918 21a1.92 1.92 0 001.635-.914l3.762-5.586a.4.4 0 00-.594-.525l-3.703 3.212a.15.15 0 01-.25-.113V7.014a.15.15 0 01.265-.097l11.193 13.404A1.92 1.92 0 0018.69 21h.391A1.92 1.92 0 0021 19.082V4.917A1.92 1.92 0 0019.083 3a1.92 1.92 0 00-1.635.914" }));
}
NEAR.DefaultColor = DefaultColor;
var NEAR_default = NEAR;
//# sourceMappingURL=NEAR.js.map
