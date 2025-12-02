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
var RBTC_exports = {};
__export(RBTC_exports, {
  default: () => RBTC_default
});
module.exports = __toCommonJS(RBTC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function RBTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.614 5.704a2.386 2.386 0 114.773 0 2.386 2.386 0 01-4.773 0" }), /* @__PURE__ */ React.createElement("path", { d: "M18.64 13.081a2.386 2.386 0 00-3.579 2.122c.024 1.051-.922 1.599-1.82 1.056l-.11-.063c-.91-.508-.909-1.589.001-2.096a2.39 2.39 0 001.252-2.1l-.002-.054.001.001c-.023-1.053.925-1.6 1.825-1.052a2.386 2.386 0 003.307-3.234 2.387 2.387 0 00-4.453 1.247c.024 1.051-.921 1.598-1.82 1.056a2.37 2.37 0 00-1.244-.35c-.456 0-.882.128-1.244.35-.896.54-1.839-.006-1.815-1.055a2.387 2.387 0 10-1.146 1.986c.898-.545 1.843 0 1.82 1.051v-.001L9.612 12c0 .907.506 1.696 1.251 2.1.91.507.91 1.59 0 2.096l-.109.063c-.896.54-1.838-.007-1.814-1.056a2.387 2.387 0 10-1.192 2.01l.043-.027-.001.002c.899-.545 1.845.002 1.82 1.052h.001l-.001.058a2.386 2.386 0 104.773-.005l-.002-.053.001.002c-.024-1.054.925-1.601 1.826-1.054l-.002-.002.049.03a2.386 2.386 0 102.384-4.135" }));
}
RBTC.DefaultColor = DefaultColor;
var RBTC_default = RBTC;
//# sourceMappingURL=RBTC.js.map
