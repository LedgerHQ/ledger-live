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
var XMCC_exports = {};
__export(XMCC_exports, {
  default: () => XMCC_default
});
module.exports = __toCommonJS(XMCC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function XMCC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.012 5.25h-3.87L11.99 7.239 10.844 5.25H6.973L3 12.131l3.847 6.66 2.607-4.514L12 18.672l2.538-4.395 2.614 4.545L21 12.162zM6.842 16.158l-2.327-4.025 1.85-3.203 2.325 4.027-1.85 3.205v-.004zm.288-8.551l.613-1.066h2.318l1.166 2.02-1.773 3.074zm4.86 8.424l-1.772-3.077 1.773-3.073.792 1.369.982 1.705-1.774 3.073zm.762-7.47l1.169-2.02h2.318l.621 1.065-2.34 4.029-1.768-3.075m5.976 4.902l-1.57 2.723-1.866-3.24 2.326-4.019.627 1.08 1.24 2.148z" }), /* @__PURE__ */ React.createElement("path", { d: "M17.012 5.214h-3.87L11.99 7.203l-1.147-1.989h-3.87L3 12.095l3.847 6.66 2.607-4.514L12 18.636l2.538-4.395 2.614 4.545L21 12.126zM6.842 16.122l-2.327-4.024 1.85-3.205 2.325 4.028-1.85 3.205v-.004zm.288-8.551l.613-1.066h2.318l1.166 2.02-1.773 3.074zm4.86 8.424l-1.772-3.077 1.773-3.073.792 1.369.982 1.705-1.774 3.073zm.762-7.47l1.169-2.02h2.318l.621 1.065-2.34 4.029-1.768-3.075m5.976 4.902l-1.57 2.724-1.866-3.24 2.326-4.02.627 1.08 1.24 2.147z" }));
}
XMCC.DefaultColor = DefaultColor;
var XMCC_default = XMCC;
//# sourceMappingURL=XMCC.js.map
