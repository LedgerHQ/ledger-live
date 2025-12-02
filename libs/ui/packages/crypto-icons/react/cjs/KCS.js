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
var KCS_exports = {};
__export(KCS_exports, {
  default: () => KCS_default
});
module.exports = __toCommonJS(KCS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0093dd";
function KCS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.78 12l3.88 3.997 2.449-2.522a1.084 1.084 0 011.566 0 1.165 1.165 0 010 1.614l-3.232 3.33a1.09 1.09 0 01-1.566 0l-4.662-4.805v2.856c0 .627-.5 1.142-1.108 1.142C6.495 17.612 6 17.1 6 16.47V7.53c0-.63.495-1.142 1.107-1.142S8.215 6.9 8.215 7.53v2.856l4.662-4.805a1.09 1.09 0 011.566 0l3.233 3.33a1.165 1.165 0 010 1.614 1.085 1.085 0 01-1.568 0L13.66 8.002zm3.882-1.143c.612 0 1.108.512 1.108 1.143 0 .63-.496 1.142-1.108 1.142S12.553 12.63 12.553 12c0-.631.497-1.143 1.109-1.143", clipRule: "evenodd" }));
}
KCS.DefaultColor = DefaultColor;
var KCS_default = KCS;
//# sourceMappingURL=KCS.js.map
