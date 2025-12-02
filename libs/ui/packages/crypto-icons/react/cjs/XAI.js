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
var XAI_exports = {};
__export(XAI_exports, {
  default: () => XAI_default
});
module.exports = __toCommonJS(XAI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ff4b2b";
function XAI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12" }), /* @__PURE__ */ React.createElement("path", { d: "M5.633 9v1.245L6.996 11.4l1.362-1.155V9h1.034v1.74l-1.59 1.34 1.59 1.34v1.74H8.358v-1.245L6.996 12.76l-1.363 1.155v1.245H4.6v-1.74l1.588-1.34L4.6 10.74V9zm8.294 0l1.297 1.328v4.832H14.19v-2.556h-2.725v2.556h-1.033v-4.832L11.728 9zm5.509 0v1.048h-1.16v4.064h1.16v1.048h-3.352v-1.048h1.159v-4.064h-1.16V9zm-5.937 1.048h-1.343l-.69.716v.792h2.724v-.792z" }));
}
XAI.DefaultColor = DefaultColor;
var XAI_default = XAI;
//# sourceMappingURL=XAI.js.map
