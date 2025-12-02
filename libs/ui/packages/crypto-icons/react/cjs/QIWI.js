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
var QIWI_exports = {};
__export(QIWI_exports, {
  default: () => QIWI_default
});
module.exports = __toCommonJS(QIWI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ff8c00";
function QIWI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.568 14.584c.038.3-.048.417-.143.417s-.229-.117-.371-.349c-.143-.232-.2-.495-.124-.63.047-.088.152-.127.276-.078.247.097.343.475.361.64m-1.333.66c.295.252.38.542.228.756a.5.5 0 01-.39.174.67.67 0 01-.448-.165c-.266-.233-.343-.62-.172-.834a.37.37 0 01.306-.135c.152 0 .323.067.476.203M4.875 11.17c0-3.685 2.933-6.671 6.55-6.671 3.62 0 6.552 2.987 6.552 6.67a6.8 6.8 0 01-.924 3.424c-.019.029-.067.019-.076-.02-.228-1.639-1.209-2.54-2.637-2.812-.124-.02-.143-.097.019-.116.438-.039 1.056-.03 1.38.03q.03-.257.029-.515c0-2.434-1.943-4.412-4.333-4.412S7.103 8.726 7.103 11.16s1.943 4.412 4.332 4.412h.2a6 6 0 01-.086-1.193c.01-.271.068-.31.182-.097.6 1.058 1.456 2.008 3.133 2.385 1.37.311 2.741.67 4.217 2.58.133.165-.066.339-.218.203-1.505-1.357-2.876-1.803-4.123-1.803-1.4.01-2.352.195-3.315.195-3.618 0-6.55-2.988-6.55-6.673" }));
}
QIWI.DefaultColor = DefaultColor;
var QIWI_default = QIWI;
//# sourceMappingURL=QIWI.js.map
