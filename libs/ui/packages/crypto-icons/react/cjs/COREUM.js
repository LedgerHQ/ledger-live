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
var COREUM_exports = {};
__export(COREUM_exports, {
  default: () => COREUM_default
});
module.exports = __toCommonJS(COREUM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#6dd39a";
function COREUM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 500 500", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M271.88 246.5c0-27.74-23.02-50.13-51.53-50.13-28.52 0-51.7 22.39-51.7 50.13s23.18 50.13 51.7 50.13 51.53-22.39 51.53-50.13M220.35 46c-58.04 0-110.57 23.22-147.93 60.65l75.05 72.18c18.35-18.38 44.2-30.08 72.88-30.08 55.54 0 100.73 43.78 100.73 97.74 0 53.97-45.2 97.74-100.73 97.74-28.19 0-53.87-11.19-72.05-29.57l-74.88 72.85c37.53 36.76 89.23 59.48 146.6 59.48 114.08 0 206.64-89.72 206.64-200.5s-92.23-200.5-206.31-200.5zm0 0" }));
}
COREUM.DefaultColor = DefaultColor;
var COREUM_default = COREUM;
//# sourceMappingURL=COREUM.js.map
