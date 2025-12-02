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
var POLY_exports = {};
__export(POLY_exports, {
  default: () => POLY_default
});
module.exports = __toCommonJS(POLY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4c5a95";
function POLY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.25 8.072l-.033-.53-.163.445-.92.772-1.053.157-.315-.292.923-1.225.945-.274-1.023.021-1.487 1.036-1.394-.096-1.958-.961-1.156.224-3.608 2.885-1.739.537-.716.699-1.279.017-.634 1.133-.89.246.841.11.783-1.015 1.209.242-.023 1.086-.603 1.563-.345 1.446-.372.577.942-.2-.107-.59.801-1.589 1.542-.598.597-.95 1.009-.706 2.002.281 2.017-.85-.341 1.345-.897.079-.256 1.104.767-.492 1.272-.53.994-1.5.063-.708.534.53 1.553.937.883-.403-.052-1.979-.256-.766 1.153-.281z" }));
}
POLY.DefaultColor = DefaultColor;
var POLY_default = POLY;
//# sourceMappingURL=POLY.js.map
