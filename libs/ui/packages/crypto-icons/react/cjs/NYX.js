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
var NYX_exports = {};
__export(NYX_exports, {
  default: () => NYX_default
});
module.exports = __toCommonJS(NYX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f35135";
function NYX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 32 32", fill: color }, /* @__PURE__ */ React.createElement("path", { stroke: "#fff", strokeWidth: 0.5, d: "M31.75 16c0 8.699-7.052 15.75-15.75 15.75S.25 24.698.25 16 7.302.25 16 .25 31.75 7.302 31.75 16z" }), /* @__PURE__ */ React.createElement("path", { d: "M23.069 8.931c-3.899-3.908-10.237-3.908-14.138 0-3.908 3.909-3.908 10.238 0 14.138 3.909 3.908 10.238 3.908 14.138 0 3.908-3.899 3.908-10.24 0-14.138m-.86 13.278c-3.429 3.428-9 3.428-12.428 0s-3.428-9 0-12.428 9-3.428 12.428 0c3.44 3.439 3.44 9 0 12.428" }), /* @__PURE__ */ React.createElement("path", { d: "M21.399 21.83V10.172a8 8 0 00-1.69-1.23V20.09L12.352 8.902a7.8 7.8 0 00-1.75 1.26V21.83a8 8 0 001.69 1.23V11.913L19.65 23.1a8 8 0 001.749-1.27" }));
}
NYX.DefaultColor = DefaultColor;
var NYX_default = NYX;
//# sourceMappingURL=NYX.js.map
