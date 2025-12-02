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
var LYX_exports = {};
__export(LYX_exports, {
  default: () => LYX_default
});
module.exports = __toCommonJS(LYX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#131313";
function LYX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.53 6.511l-5.076-2.933c-.9-.52-2.008-.52-2.908 0L5.471 6.51a2.91 2.91 0 00-1.454 2.523v5.87c0 1.04.554 2.002 1.454 2.522l5.075 2.934c.9.52 2.008.52 2.908 0l5.075-2.934a2.91 2.91 0 001.454-2.523V9.034a2.91 2.91 0 00-1.454-2.523m-2.503 6.04l-1.51 2.618c-.207.36-.59.583-1.007.583h-3.02c-.416 0-.8-.222-1.007-.583l-1.51-2.618a1.17 1.17 0 010-1.164l1.51-2.618a1.16 1.16 0 011.007-.584h3.02c.416 0 .8.223 1.007.584l1.51 2.618c.207.358.207.803 0 1.164" }));
}
LYX.DefaultColor = DefaultColor;
var LYX_default = LYX;
//# sourceMappingURL=LYX.js.map
