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
var XDN_exports = {};
__export(XDN_exports, {
  default: () => XDN_default
});
module.exports = __toCommonJS(XDN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4f7aa2";
function XDN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.982 9h2.053c.992 0 2.762.602 2.762 3s-1.77 3-2.762 3H9.983zm1.132 4.785h.85c.709 0 1.559-.434 1.559-1.785s-.85-1.785-1.558-1.785h-.85zM15.578 9h.424l3.824 5.27V9h.424v6h-.425L16 9.846V15h-.425zM3.75 9h1.416v1.5H3.75zm2.125 0H7.29v1.5H5.875zm2.124 0h1.417v1.5H7.999zm0 2.25h1.417v1.5H7.999zm0 2.25h1.417V15H7.999zm-2.124-2.25H7.29v1.5H5.875z" }));
}
XDN.DefaultColor = DefaultColor;
var XDN_default = XDN;
//# sourceMappingURL=XDN.js.map
