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
var LL_exports = {};
__export(LL_exports, {
  default: () => LL_default
});
module.exports = __toCommonJS(LL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function LL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { viewBox: "0 0 1200 1200", height: size, width: size, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M515.156 608.41c-15.329 15.328-15.329 40.774 0 56.41l112.82 112.82a39.783 39.783 0 0056.411 0c15.33-15.329 15.33-40.775 0-56.41l-112.82-112.82c-15.33-15.33-40.775-15.33-56.41 0" }), /* @__PURE__ */ React.createElement("path", { d: "M898.685 563.342a39.783 39.783 0 000-56.41c-15.329-15.329-40.775-15.329-56.41 0L684.387 664.82l-28.205 28.205c-34.95 34.95-82.776 29.431-98.412 14.102l70.207 70.207c15.329 15.329 40.775 15.329 56.41 0zm-213.378-10.73c15.329-15.329 15.329-40.775 0-56.41L572.487 383.38a39.783 39.783 0 00-56.411 0c-15.329 15.329-15.329 40.775 0 56.41l112.82 112.821c15.636 15.329 40.775 15.329 56.41 0" }), /* @__PURE__ */ React.createElement("path", { d: "M301.778 597.986a39.783 39.783 0 000 56.41c15.329 15.329 40.775 15.329 56.41 0l157.888-158.194 28.205-28.206c34.95-34.95 82.776-29.431 98.412-14.102l-70.207-70.206c-15.329-15.33-40.775-15.33-56.41 0z" }));
}
LL.DefaultColor = DefaultColor;
var LL_default = LL;
//# sourceMappingURL=LL.js.map
