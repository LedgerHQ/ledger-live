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
var UMA_exports = {};
__export(UMA_exports, {
  default: () => UMA_default
});
module.exports = __toCommonJS(UMA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ff4a4a";
function UMA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M14.524 14.243h-.759a.26.26 0 01-.26-.26v-1.997l-1.33.83a.34.34 0 01-.365 0l-1.322-.83v1.997a.26.26 0 01-.26.26h-.752a.26.26 0 01-.26-.26V10.13a.345.345 0 01.345-.345q.104 0 .189.064l2.095 1.441a.24.24 0 00.289 0l2.095-1.441a.348.348 0 01.541.28v3.854a.245.245 0 01-.149.24.3.3 0 01-.097.02m-6.44-.007h-4.71a.345.345 0 01-.346-.345v-3.874a.265.265 0 01.267-.26h.76c.14 0 .26.113.26.26v2.946H7.17v-2.946a.26.26 0 01.26-.26h.739a.26.26 0 01.26.26v3.875a.345.345 0 01-.345.344m7.832-4.479h4.712a.345.345 0 01.344.345v3.874c0 .14-.113.26-.254.26h-.759a.26.26 0 01-.26-.26v-2.777a.17.17 0 00-.169-.17h-2.51a.17.17 0 00-.169.17v2.777a.26.26 0 01-.26.26h-.759a.26.26 0 01-.26-.26V10.1a.345.345 0 01.345-.344" }), /* @__PURE__ */ React.createElement("path", { d: "M17.892 11.845h.753c.14 0 .26.113.26.26v.767a.26.26 0 01-.26.26h-.753a.26.26 0 01-.26-.26v-.773c0-.141.12-.254.26-.254" }));
}
UMA.DefaultColor = DefaultColor;
var UMA_default = UMA;
//# sourceMappingURL=UMA.js.map
