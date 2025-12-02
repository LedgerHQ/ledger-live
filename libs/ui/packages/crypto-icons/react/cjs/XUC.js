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
var XUC_exports = {};
__export(XUC_exports, {
  default: () => XUC_default
});
module.exports = __toCommonJS(XUC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function XUC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0m-2.828.26c.006-.094 0 0 0-.096 0-2.705-1.998-5.108-4.591-5.512V5.077l-1.68.523v1.053a5.41 5.41 0 00-4.576 5.343 5.416 5.416 0 004.757 5.374v1.551l1.68-.523v-1.085a5.42 5.42 0 004.081-3.51h-1.74a3.81 3.81 0 01-5.96.99 3.82 3.82 0 01-1.208-2.52l9.238-.014m-8.984-1.662a3.82 3.82 0 017.107 0z" }), /* @__PURE__ */ React.createElement("path", { d: "M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0m-2.828.26c.006-.094 0 0 0-.096 0-2.705-1.998-5.108-4.591-5.512V5.077l-1.68.523v1.053a5.41 5.41 0 00-4.576 5.343 5.416 5.416 0 004.757 5.374v1.551l1.68-.523v-1.085a5.42 5.42 0 004.081-3.51h-1.74a3.81 3.81 0 01-5.96.99 3.82 3.82 0 01-1.208-2.52l9.238-.014m-8.984-1.662a3.82 3.82 0 017.107 0z" }));
}
XUC.DefaultColor = DefaultColor;
var XUC_default = XUC;
//# sourceMappingURL=XUC.js.map
