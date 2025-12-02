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
var GENERIC_exports = {};
__export(GENERIC_exports, {
  default: () => GENERIC_default
});
module.exports = __toCommonJS(GENERIC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#efb914";
function GENERIC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.751 7.391A5.96 5.96 0 0118 11.46l-2.135-.531a4.02 4.02 0 00-2.895-2.75c-2.15-.536-4.32.742-4.85 2.854-.528 2.111.788 4.256 2.939 4.79a4.03 4.03 0 003.85-1.072l2.135.53a5.98 5.98 0 01-3.9 2.54l-.607 2.43-1.947-.484.483-1.931a6 6 0 01-.974-.242l-.482 1.931-1.947-.485.608-2.43c-1.784-1.407-2.682-3.747-2.103-6.061s2.472-3.96 4.71-4.367l.607-2.431 1.947.484-.483 1.931q.496.081.974.242l.482-1.931 1.947.484z", clipRule: "evenodd" }));
}
GENERIC.DefaultColor = DefaultColor;
var GENERIC_default = GENERIC;
//# sourceMappingURL=GENERIC.js.map
