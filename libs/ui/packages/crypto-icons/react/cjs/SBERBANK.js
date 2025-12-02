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
var SBERBANK_exports = {};
__export(SBERBANK_exports, {
  default: () => SBERBANK_default
});
module.exports = __toCommonJS(SBERBANK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#48b254";
function SBERBANK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M17.01 5.151l.71.644-8.95 5.108L4.44 8.41l.404-.805 3.928 2.233zm-1.8-1.026l.95.483-7.39 4.224L5.33 6.88l.586-.703 2.855 1.629zm3.137 2.333l.526.704L8.77 12.936 3.893 10.16l.222-.885 4.657 2.656zm1.457 2.595q.447 1.248.446 2.615 0 1.369-.445 2.655l-.203.543a8.4 8.4 0 01-1.761 2.615 8.1 8.1 0 01-2.633 1.73 8.13 8.13 0 01-6.437 0 8.5 8.5 0 01-2.612-1.73 7.9 7.9 0 01-1.761-2.615 8.2 8.2 0 01-.648-3.198v-.543l5.02 2.836 10.59-6.034z", clipRule: "evenodd" }));
}
SBERBANK.DefaultColor = DefaultColor;
var SBERBANK_default = SBERBANK;
//# sourceMappingURL=SBERBANK.js.map
