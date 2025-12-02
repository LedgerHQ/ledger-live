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
var HT_exports = {};
__export(HT_exports, {
  default: () => HT_default
});
module.exports = __toCommonJS(HT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2a3069";
function HT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M13.85 8.437c0-2.64-1.28-4.88-2.24-5.6 0 0-.08-.08-.08.08-.08 5.04-2.64 6.4-4 8.32-3.28 4.24-.24 8.96 2.88 9.84 1.76.48-.4-.88-.64-3.68-.4-3.52 4.08-6.08 4.08-8.96" }), /* @__PURE__ */ React.createElement("path", { d: "M15.53 10.197c-.16.64-.8 2-1.68 3.28-2.96 4.24-1.28 6.32-.32 7.44.56.64 0 0 1.36-.64.08-.08 2.72-1.44 2.96-4.56.32-3.04-1.6-4.96-2.32-5.52" }));
}
HT.DefaultColor = DefaultColor;
var HT_default = HT;
//# sourceMappingURL=HT.js.map
