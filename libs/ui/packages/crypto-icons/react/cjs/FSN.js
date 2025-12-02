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
var FSN_exports = {};
__export(FSN_exports, {
  default: () => FSN_default
});
module.exports = __toCommonJS(FSN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1d9ad7";
function FSN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M21.75 10.659c-.758-.79-2.312-1.452-5.212-1.858a45 45 0 00-2.752-.299c-.715-.043-1.409-.085-2.08-.085-1.114 1.665-2.165 3.672-3.09 6.085-1.009 2.647-1.912 5.253-2.542 7.623h-.189c.063-2.541.483-5.423 1.345-8.413.568-1.942 1.24-3.652 1.996-5.145-3.405.363-5.842 1.409-6.976 2.903.967-2.37 3.845-4.377 8.237-5.081 2.333-3.481 5.085-5.04 7.376-4.356.798.234 1.47.747 2.017 1.473a.7.7 0 00-.21-.107c-1.681-.683-3.95.299-6.157 2.733h.105c4.938-.021 7.438 2.072 8.132 4.527m-6.178 3.202c1.344 0 2.437 1.132 2.437 2.52s-1.093 2.52-2.437 2.52c-1.345 0-2.438-1.132-2.438-2.52 0-1.409 1.093-2.52 2.438-2.52", clipRule: "evenodd" }));
}
FSN.DefaultColor = DefaultColor;
var FSN_default = FSN;
//# sourceMappingURL=FSN.js.map
