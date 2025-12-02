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
var SOC_exports = {};
__export(SOC_exports, {
  default: () => SOC_default
});
module.exports = __toCommonJS(SOC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#199248";
function SOC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 3a9 9 0 100 18 9 9 0 000-18m2.057 16.677a7.947 7.947 0 11-3.446-15.502 7.948 7.948 0 013.446 15.502" }), /* @__PURE__ */ React.createElement("path", { d: "M14.198 5.465c0 .388 0 .775.014 1.163a7.3 7.3 0 00-1.609-.422c-.022-.351.078-.738-.025-1.071A10 10 0 0011.4 5.12c-.02.362-.012.725 0 1.088a7.4 7.4 0 00-1.61.43q.018-.586.01-1.174a6.9 6.9 0 000 13.078q0-.575-.01-1.149c.514.202 1.051.34 1.599.412 0 .352 0 .704-.021 1.052.42.06.846.06 1.266 0a20 20 0 01-.03-1.04 7.6 7.6 0 001.605-.409q-.018.57 0 1.14A6.9 6.9 0 0014.2 5.471zm1.027 10.452c-.906.82-2.193 1.015-3.375.998-1.037 0-2.135-.281-2.884-1.032-.398-.384-.623-.897-.825-1.406.725-.188 1.473-.251 2.202-.407a1.28 1.28 0 00.854.958c.662.207 1.483.236 2.035-.237.391-.324.402-1.034-.083-1.277-1.138-.588-2.555-.389-3.63-1.133-1.482-.934-1.591-3.41-.142-4.418 1.109-.778 2.59-.875 3.876-.563 1.163.294 1.992 1.28 2.39 2.371q-1.072.188-2.145.371c-.188-1.136-1.78-1.406-2.57-.744-.45.375-.334 1.172.228 1.371 1.23.51 2.708.363 3.797 1.217 1.266.858 1.398 2.907.271 3.93z" }));
}
SOC.DefaultColor = DefaultColor;
var SOC_default = SOC;
//# sourceMappingURL=SOC.js.map
