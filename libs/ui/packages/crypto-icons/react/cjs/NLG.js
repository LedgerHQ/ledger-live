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
var NLG_exports = {};
__export(NLG_exports, {
  default: () => NLG_default
});
module.exports = __toCommonJS(NLG_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2ab0fd";
function NLG({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M19.136 11.104c.124-.002.203.015.252.06.053.048.074.126.085.248.35 4.034-2.702 7.68-6.749 8.055-4.173.386-7.795-2.625-8.191-6.81-.386-4.064 2.666-7.751 6.74-8.122 2.306-.21 4.298.515 5.975 2.112.018.017.014.086-.006.105q-.564.576-1.14 1.14c-.021.022-.1.019-.123-.003-1.73-1.585-3.735-2.055-5.928-1.256-2.217.808-3.485 2.48-3.736 4.835-.338 3.187 2.068 5.996 5.276 6.238 2.909.219 5.544-1.84 6.026-4.714.005-.028-.06-.1-.093-.1-1.796-.005-3.592-.003-5.388-.01-.046 0-.132-.086-.134-.134q-.015-.753 0-1.506c0-.045.081-.126.125-.126 1.197-.007 5.87.003 7.008-.013z", clipRule: "evenodd" }));
}
NLG.DefaultColor = DefaultColor;
var NLG_default = NLG;
//# sourceMappingURL=NLG.js.map
