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
var BURST_exports = {};
__export(BURST_exports, {
  default: () => BURST_default
});
module.exports = __toCommonJS(BURST_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2d2d2d";
function BURST({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.28 14.472L4.5 12.578h3.866l.383-1.833 3.433.003L13.04 6h3.454c2.339 0 3.287.941 2.936 2.884l-.075.416c-.204 1.132-.721 1.884-1.61 2.318.88.45 1.176 1.301.955 2.528l-.171.95c-.342 1.894-1.736 2.904-4 2.904h-3.655l.947-5.245h-1.148zm3.799-2.06l-.708 3.922h1.459c.865 0 1.346-.384 1.51-1.29l.183-1.014c.209-1.158-.192-1.618-1.327-1.618zm.857-4.747l-.618 3.423h1.06c.965 0 1.53-.412 1.703-1.372l.118-.65c.169-.935-.18-1.401-1.067-1.401z" }));
}
BURST.DefaultColor = DefaultColor;
var BURST_default = BURST;
//# sourceMappingURL=BURST.js.map
