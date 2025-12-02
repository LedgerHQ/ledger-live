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
var CELO_exports = {};
__export(CELO_exports, {
  default: () => CELO_default
});
module.exports = __toCommonJS(CELO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#42d689";
function CELO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.105 19.105a5.21 5.21 0 100-10.42 5.21 5.21 0 100 10.42m0 1.895a7.105 7.105 0 110-14.21 7.105 7.105 0 010 14.21" }), /* @__PURE__ */ React.createElement("path", { d: "M13.895 15.316a5.21 5.21 0 100-10.421 5.21 5.21 0 100 10.42m0 1.894a7.105 7.105 0 110-14.21 7.105 7.105 0 010 14.21" }), /* @__PURE__ */ React.createElement("path", { d: "M14.13 17.21a5.2 5.2 0 001.032-2.048c.75-.187 1.45-.54 2.048-1.032a7 7 0 01-.553 2.53 7.1 7.1 0 01-2.527.55M8.838 8.839a5.2 5.2 0 00-2.049 1.032c.027-.87.215-1.726.554-2.527A7.1 7.1 0 019.87 6.79a5.2 5.2 0 00-1.032 2.049" }));
}
CELO.DefaultColor = DefaultColor;
var CELO_default = CELO;
//# sourceMappingURL=CELO.js.map
