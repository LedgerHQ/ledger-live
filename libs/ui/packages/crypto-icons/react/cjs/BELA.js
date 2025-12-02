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
var BELA_exports = {};
__export(BELA_exports, {
  default: () => BELA_default
});
module.exports = __toCommonJS(BELA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#13a0f6";
function BELA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M6.327 9.096a1.82 1.82 0 01-.972-1.61 1.812 1.812 0 113.414-.85 6.67 6.67 0 013.376-.912c3.705 0 6.71 3.01 6.71 6.723s-3.004 6.723-6.71 6.723-6.71-3.01-6.71-6.723a6.7 6.7 0 01.892-3.35m5.818 6.659c1.823 0 3.3-1.48 3.3-3.308a3.304 3.304 0 00-3.3-3.307 3.304 3.304 0 00-3.3 3.307 3.304 3.304 0 003.3 3.308", clipRule: "evenodd" }));
}
BELA.DefaultColor = DefaultColor;
var BELA_default = BELA;
//# sourceMappingURL=BELA.js.map
