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
var TAAS_exports = {};
__export(TAAS_exports, {
  default: () => TAAS_default
});
module.exports = __toCommonJS(TAAS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#002342";
function TAAS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M3 9.75h.974v.916H3zm.974 3.58h2.832v.92H3v-2.668h2.858v.914H3.974zm13.22-1.748H21v2.668h-2.858v-.92h1.884v-.833h-2.832zm2.848-.872h-2.85v-.916h2.85zm-12.308.871h3.806v1.789h-.948v.88H7.734zm2.833 1.75v-.834h-1.86v.833zM7.734 9.75h3.806v.916H7.734zm4.75 1.832h3.807v1.787h-.948v.881h-2.858zm2.83 1.749v-.834h-1.86v.833zm-2.83-3.581h3.807v.916h-3.806z" }));
}
TAAS.DefaultColor = DefaultColor;
var TAAS_default = TAAS;
//# sourceMappingURL=TAAS.js.map
