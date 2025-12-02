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
var RISE_exports = {};
__export(RISE_exports, {
  default: () => RISE_default
});
module.exports = __toCommonJS(RISE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f49352";
function RISE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.454 6.866c-.643 0-1.164-.53-1.164-1.182 0-.654.521-1.184 1.164-1.184s1.164.53 1.164 1.184-.52 1.182-1.164 1.182M14.585 19.5a1.174 1.174 0 01-1.164-1.183c0-.653.522-1.183 1.164-1.183.644 0 1.165.53 1.165 1.183 0 .654-.521 1.183-1.165 1.183m-4.653-8.842a1.035 1.035 0 01-1.467-.2A1.074 1.074 0 018.66 8.97l5.369-4.171a1.035 1.035 0 011.466.199 1.074 1.074 0 01-.195 1.49zm.04 4.251a1.036 1.036 0 01-1.467-.199 1.074 1.074 0 01.195-1.49l5.369-4.17a1.035 1.035 0 011.466.198 1.074 1.074 0 01-.195 1.49zm0 4.372a1.035 1.035 0 01-1.467-.199 1.074 1.074 0 01.195-1.49l5.369-4.17a1.035 1.035 0 011.466.198 1.074 1.074 0 01-.195 1.49z", clipRule: "evenodd" }));
}
RISE.DefaultColor = DefaultColor;
var RISE_default = RISE;
//# sourceMappingURL=RISE.js.map
