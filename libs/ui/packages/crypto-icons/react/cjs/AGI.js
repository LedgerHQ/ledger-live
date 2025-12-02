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
var AGI_exports = {};
__export(AGI_exports, {
  default: () => AGI_default
});
module.exports = __toCommonJS(AGI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#6916ff";
function AGI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.2, d: "M12.739 5.04a.21.21 0 01-.06-.271.22.22 0 01.233 0 4.2 4.2 0 011.406.954c.228.21.418.456.563.727q.23.415.375.864c.092.31.14.632.141.954-.047.319-.094 1.864-.985 2.591a.535.535 0 01-.703-.136.47.47 0 01-.047-.546 3.79 3.79 0 00.094-3.954 8 8 0 00-1.017-1.182m-1.383 13.937c.094.091.094.182.047.227-.046.046-.14.091-.187.046a4.2 4.2 0 01-1.407-.954 2.8 2.8 0 01-.562-.728 5 5 0 01-.375-.863 3.4 3.4 0 01-.141-.955c.047-.318.094-1.864.985-2.591a.536.536 0 01.703.136.405.405 0 010 .546 3.79 3.79 0 00-.094 3.954q.458.639 1.031 1.182" }), /* @__PURE__ */ React.createElement("path", { d: "M15.402 15.227a4.1 4.1 0 00-.985-2.363 8.1 8.1 0 00-1.969-1.455c-.633-.35-1.23-.763-1.781-1.232a3 3 0 01-.89-1.59 3.2 3.2 0 01.229-1.86 5 5 0 011.317-1.682.195.195 0 00.047-.227.18.18 0 00-.281-.045A4.2 4.2 0 009.26 6.318a3.76 3.76 0 00-.66 2.455c.037.44.148.87.328 1.273a4.5 4.5 0 00.75 1.09 8.1 8.1 0 002.015 1.41c.636.33 1.234.726 1.782 1.181.481.423.797 1.003.89 1.637.133.659.05 1.342-.234 1.954a4.6 4.6 0 01-1.36 1.637.15.15 0 00-.074.103.15.15 0 00.027.124.18.18 0 00.13.09.2.2 0 00.152-.044 5.85 5.85 0 001.781-1.592 3.88 3.88 0 00.614-2.409" }));
}
AGI.DefaultColor = DefaultColor;
var AGI_default = AGI;
//# sourceMappingURL=AGI.js.map
