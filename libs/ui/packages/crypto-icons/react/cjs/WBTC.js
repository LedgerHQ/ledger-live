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
var WBTC_exports = {};
__export(WBTC_exports, {
  default: () => WBTC_default
});
module.exports = __toCommonJS(WBTC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#201a2d";
function WBTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.169 7.245l-.45.45a6.37 6.37 0 010 8.598l.45.45a7.014 7.014 0 000-9.508zm-9.464.039a6.37 6.37 0 018.598 0l.45-.45a7.014 7.014 0 00-9.508 0zm-.421 9.014a6.37 6.37 0 010-8.594l-.45-.45a7.014 7.014 0 000 9.509zm9.013.415a6.37 6.37 0 01-8.598 0l-.45.45a7.014 7.014 0 009.509 0zm-1.456-6.215c-.09-.938-.9-1.253-1.925-1.35V7.857h-.792v1.268h-.633v-1.27h-.786v1.303H9.1v.847s.585-.01.576 0a.41.41 0 01.45.348v3.564a.28.28 0 01-.096.194.27.27 0 01-.204.069c.01.008-.576 0-.576 0l-.15.946h1.591v1.323h.792v-1.304h.633v1.298h.794v-1.308c1.338-.081 2.27-.411 2.388-1.663.094-1.008-.38-1.458-1.137-1.64.46-.227.745-.647.68-1.334m-1.11 2.818c0 .983-1.686.871-2.223.871v-1.746c.537.002 2.223-.153 2.223.874m-.368-2.46c0 .9-1.407.79-1.854.79v-1.587c.447 0 1.854-.141 1.854.797" }), /* @__PURE__ */ React.createElement("path", { d: "M11.999 20.195a8.195 8.195 0 11.003-16.39 8.195 8.195 0 01-.004 16.39m0-15.75a7.55 7.55 0 00.005 15.102A7.55 7.55 0 1012 4.444" }));
}
WBTC.DefaultColor = DefaultColor;
var WBTC_default = WBTC;
//# sourceMappingURL=WBTC.js.map
