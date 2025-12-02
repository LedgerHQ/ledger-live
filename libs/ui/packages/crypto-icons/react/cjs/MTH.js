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
var MTH_exports = {};
__export(MTH_exports, {
  default: () => MTH_default
});
module.exports = __toCommonJS(MTH_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function MTH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M5.25 7.176l3.175 5.327V18c-1.753 0-3.175-1.377-3.175-3.076z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.6, d: "M15.574 12.497l3.174-5.324h.001v7.752c0 1.698-1.421 3.075-3.175 3.075z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.8, d: "M11.998 12.343l-1.588 2.664q-.494-.124-1.062-.958L5.25 7.175c1.519-.85 3.461-.345 4.338 1.125z" }), /* @__PURE__ */ React.createElement("path", { d: "M14.412 8.295c.877-1.472 2.82-1.976 4.338-1.126l-4.098 6.874A3.2 3.2 0 0112 15.426c-.494 0-.98-.11-1.425-.326l-.165-.092z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M5.25 6.798l3.175 5.327v5.497c-1.753 0-3.175-1.377-3.175-3.076z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.6, d: "M15.574 12.119l3.174-5.324h.001v7.752c0 1.698-1.421 3.075-3.175 3.075z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.8, d: "M11.998 11.965l-1.588 2.664q-.494-.124-1.062-.958L5.25 6.797c1.519-.85 3.461-.345 4.338 1.125z" }), /* @__PURE__ */ React.createElement("path", { d: "M14.412 7.917c.877-1.472 2.82-1.976 4.338-1.126l-4.098 6.874A3.2 3.2 0 0112 15.048c-.494 0-.98-.11-1.425-.326l-.165-.093z" }));
}
MTH.DefaultColor = DefaultColor;
var MTH_default = MTH;
//# sourceMappingURL=MTH.js.map
