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
var CIX_exports = {};
__export(CIX_exports, {
  default: () => CIX_default
});
module.exports = __toCommonJS(CIX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0576b4";
function CIX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.717 13.911l-.794-.497 1.733-.02.036-.02v.019l.715-.008-1.214 1.976-.109-.953-5.523 3.048-2.095-2.797-5.872 3.094v-.705l6.055-3.19 2.094 2.797zm-7.584-.679l-2.295 1.209V6.246h2.295zm6.49.361l-2.295 1.275V6.247h2.295z" }), /* @__PURE__ */ React.createElement("path", { d: "M13.378 15.396l-.492.273-1.803-2.408V7.185h2.295zm-6.49-.455L4.593 16.15V8.248h2.295z", opacity: 0.5 }));
}
CIX.DefaultColor = DefaultColor;
var CIX_default = CIX;
//# sourceMappingURL=CIX.js.map
