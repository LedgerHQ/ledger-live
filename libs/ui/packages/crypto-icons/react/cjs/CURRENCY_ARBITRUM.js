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
var CURRENCY_ARBITRUM_exports = {};
__export(CURRENCY_ARBITRUM_exports, {
  default: () => CURRENCY_ARBITRUM_default
});
module.exports = __toCommonJS(CURRENCY_ARBITRUM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function CURRENCY_ARBITRUM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M13.892 11.298l1.234-2.093 3.325 5.178.001.994-.01-6.839a.52.52 0 00-.239-.41l-5.986-3.443a.53.53 0 00-.51.033l-.022.013-5.81 3.367-.022.01a.51.51 0 00-.3.437l.009 5.573 3.097-4.8c.39-.636 1.239-.84 2.028-.83l.925.025-5.453 8.745.643.37 5.518-9.106 2.44-.01-5.505 9.337 2.294 1.32.274.157c.116.048.253.05.37.008l6.07-3.518-1.161.673zm.471 6.778l-2.317-3.636 1.414-2.4 3.043 4.796z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.65, d: "M12.046 14.44l2.317 3.636 2.14-1.24-3.043-4.796zm6.406.937l-.001-.994-3.325-5.178-1.234 2.093 3.21 5.19 1.16-.672a.5.5 0 00.19-.374z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.15, d: "M19.48 8.5a1.55 1.55 0 00-.73-1.249l-6.063-3.487a1.58 1.58 0 00-1.392 0c-.05.025-5.897 3.416-5.897 3.416q-.121.059-.232.137a1.54 1.54 0 00-.646 1.18v7.222l1.042-1.6-.01-5.573a.51.51 0 01.215-.387c.028-.02 5.974-3.462 5.993-3.472a.53.53 0 01.457-.002l5.986 3.443c.142.09.23.243.238.41v6.904a.5.5 0 01-.179.374l-1.16.673-.599.347-2.14 1.24-2.17 1.258a.53.53 0 01-.37-.008L9.255 17.85l-.525.89 2.308 1.329.366.204c.164.08.4.126.613.126q.294 0 .565-.106l6.304-3.651a1.54 1.54 0 00.594-1.161z" }));
}
CURRENCY_ARBITRUM.DefaultColor = DefaultColor;
var CURRENCY_ARBITRUM_default = CURRENCY_ARBITRUM;
//# sourceMappingURL=CURRENCY_ARBITRUM.js.map
