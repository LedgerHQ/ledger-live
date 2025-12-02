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
var APPC_exports = {};
__export(APPC_exports, {
  default: () => APPC_default
});
module.exports = __toCommonJS(APPC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fd875e";
function APPC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.245 13.415l1.79-5.334 1.822 5.334zm7.584 3.373l-1.48-3.982h.884a.637.637 0 00.637-.627.6.6 0 00-.178-.42.62.62 0 00-.43-.175h-1.38l-.22-.62h1.57a.63.63 0 00.635-.605.6.6 0 00-.186-.443.64.64 0 00-.451-.182h-2.04l-1.105-2.976a2.7 2.7 0 00-.793-1.096 1.87 1.87 0 00-1.247-.41 1.93 1.93 0 00-1.253.41 2.7 2.7 0 00-.795 1.095L8.839 9.76H6.811a.607.607 0 00-.612.598c0 .344.284.622.635.622h1.54l-.237.603h-1.38a.606.606 0 00-.614.6c0 .34.28.616.627.617h.886L6.15 16.787a2 2 0 00-.151.706c.015.34.166.66.42.892.28.238.637.367 1.005.363a1.35 1.35 0 001.38-.98l.582-1.7h5.358l.583 1.741a1.36 1.36 0 001.38.93c.232.006.46-.052.663-.165q.263-.191.46-.448a1.2 1.2 0 00.169-.633 4 4 0 00-.171-.695z" }));
}
APPC.DefaultColor = DefaultColor;
var APPC_default = APPC;
//# sourceMappingURL=APPC.js.map
