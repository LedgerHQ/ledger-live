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
var XIN_exports = {};
__export(XIN_exports, {
  default: () => XIN_default
});
module.exports = __toCommonJS(XIN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1eb5fa";
function XIN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M19.836 5.501L17.113 6.71a.5.5 0 00-.262.442v9.735a.5.5 0 00.27.443l2.722 1.177a.254.254 0 00.375-.225V5.726a.262.262 0 00-.382-.225M6.796 6.694l-2.64-1.2a.254.254 0 00-.374.225v12.555a.256.256 0 00.39.217l2.655-1.402a.5.5 0 00.24-.428V7.136a.53.53 0 00-.27-.442m8.28 3.322L12.235 8.39a.5.5 0 00-.502 0L8.837 10a.51.51 0 00-.255.443v3.3c0 .182.097.35.255.442l2.895 1.665a.5.5 0 00.502 0l2.843-1.65a.51.51 0 00.255-.442v-3.3a.5.5 0 00-.255-.443" }));
}
XIN.DefaultColor = DefaultColor;
var XIN_default = XIN;
//# sourceMappingURL=XIN.js.map
