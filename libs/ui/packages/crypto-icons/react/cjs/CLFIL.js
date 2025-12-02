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
var CLFIL_exports = {};
__export(CLFIL_exports, {
  default: () => CLFIL_default
});
module.exports = __toCommonJS(CLFIL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function CLFIL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, fill: color, viewBox: "0 0 512 512" }, /* @__PURE__ */ React.createElement("path", { d: "M379.398 288.735h-58.23c-6.932 37.97-35.354 49.015-61.003 49.015-36.047 0-63.429-28.304-63.429-81.116 0-51.086 27.382-80.426 62.736-80.426 28.075 0 53.377 14.843 59.963 49.015h58.23c-8.665-56.954-53.031-97.684-116.114-97.684-78.333 0-127.551 50.05-127.551 129.095 0 80.081 47.485 129.786 125.818 129.786 63.43 0 110.568-39.695 119.58-97.685" }));
}
CLFIL.DefaultColor = DefaultColor;
var CLFIL_default = CLFIL;
//# sourceMappingURL=CLFIL.js.map
