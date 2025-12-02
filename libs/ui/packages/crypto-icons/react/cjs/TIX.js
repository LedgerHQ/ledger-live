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
var TIX_exports = {};
__export(TIX_exports, {
  default: () => TIX_default
});
module.exports = __toCommonJS(TIX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ef494d";
function TIX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M4.5 8.54c0-.16.13-.29.29-.29h3.77c1.738 0 2.826.897 2.826 2.164q0 .794-.725 1.442 1.014.578 1.014 1.73c0 1.804-1.74 2.164-2.899 2.164H4.79a.29.29 0 01-.29-.29v-.862c0-.16.13-.29.29-.29h3.985q1.233 0 1.233-.794 0-.792-1.233-.865H4.79a.29.29 0 01-.29-.289v-.862c0-.161.13-.29.29-.29h3.985q.87-.145.87-.722 0-.793-.87-.793H4.79a.29.29 0 01-.29-.29zm7.827 0c0-.16.13-.29.29-.29h3.84c.16 0 .29.13.29.29v6.92a.29.29 0 01-.29.29h-1.088a.29.29 0 01-.29-.29V9.983a.29.29 0 00-.289-.29h-2.175a.29.29 0 01-.29-.29zm5.433-.29h1.45c.16 0 .29.13.29.29v.862a.29.29 0 01-.29.29h-1.45a.29.29 0 01-.29-.29V8.54c0-.16.13-.29.29-.29", clipRule: "evenodd" }));
}
TIX.DefaultColor = DefaultColor;
var TIX_default = TIX;
//# sourceMappingURL=TIX.js.map
