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
var ZCL_exports = {};
__export(ZCL_exports, {
  default: () => ZCL_default
});
module.exports = __toCommonJS(ZCL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#c87035";
function ZCL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.994 20.25c-4.556-.003-8.244-3.698-8.244-8.26 0-4.554 3.699-8.243 8.261-8.24 4.549.003 8.245 3.7 8.239 8.252-.009 4.501-3.627 8.242-8.256 8.248m-3.362-4.477q.034-.067.058-.108 1.108-1.953 2.217-3.902.973-1.708 1.939-3.418a.11.11 0 01.113-.068q1.13.005 2.26.004h.108l-3.13 5.52.079.003q2.834 0 5.664.003c.064 0 .084-.024.098-.079a6.24 6.24 0 00-1.735-6.251 5.7 5.7 0 00-1.38-.973 6.16 6.16 0 00-3.963-.6c-1.38.245-2.543.897-3.496 1.928-.125.135-.239.28-.358.42.003.008.01.014.012.022h5.385c-.03.056-.05.097-.073.135-.328.582-.66 1.161-.985 1.744a.15.15 0 01-.152.087q-2.544-.005-5.087-.003h-.103c-.859 2.702.355 6.091 3.401 7.447 2.949 1.317 6.041.105 7.491-1.918q-4.18.009-8.362.006zm9.482 1.423c1.046-1.163 1.976-3.075 1.918-5.372-.047-1.892-.695-3.555-1.906-5.025-.378.38-.747.75-1.113 1.12 1.92 2.31 2.002 5.724.02 8.176z" }));
}
ZCL.DefaultColor = DefaultColor;
var ZCL_default = ZCL;
//# sourceMappingURL=ZCL.js.map
