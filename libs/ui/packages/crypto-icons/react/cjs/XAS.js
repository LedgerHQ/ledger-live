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
var XAS_exports = {};
__export(XAS_exports, {
  default: () => XAS_default
});
module.exports = __toCommonJS(XAS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function XAS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M19.494 10.853l-7.102 8.258-.319.389-7.568-8.563.024-.01-.029-.005 2.941-4.917.002.001L7.441 6h9.191l-.002.005 2.87 4.847zm-9.852.345l-1.627 2.755 4.013 4.584 4.023-4.621-1.592-2.727zm-2.083 2.234l1.32-2.234-3.272.005zm7.292-2.884l3.715-.006-2.332-3.906-3.662.008zm3.578.634l-3.205.006 1.285 2.201zm-4.343-.633l-2.018-3.458-2.048 3.465zm-6.3-3.895l-2.324 3.91 3.795-.007 2.31-3.91z" }), /* @__PURE__ */ React.createElement("path", { d: "M19.494 10.103l-7.102 8.258-.319.389-7.568-8.563.024-.01-.029-.005 2.941-4.917.002.001-.002-.006h9.191l-.002.005 2.87 4.847zm-9.852.345l-1.627 2.755 4.013 4.584 4.023-4.621-1.592-2.727zm-2.083 2.234l1.32-2.234-3.272.005zm7.292-2.884l3.715-.006-2.332-3.906-3.662.008zm3.578.634l-3.205.006 1.285 2.201zM14.086 9.8l-2.018-3.458-2.048 3.465zm-6.3-3.895l-2.324 3.91 3.795-.007 2.31-3.91z" }));
}
XAS.DefaultColor = DefaultColor;
var XAS_default = XAS;
//# sourceMappingURL=XAS.js.map
