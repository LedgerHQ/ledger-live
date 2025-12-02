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
var POLIS_exports = {};
__export(POLIS_exports, {
  default: () => POLIS_default
});
module.exports = __toCommonJS(POLIS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2c3e50";
function POLIS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M19.238 18.004v-.75c0-.148-.1-.247-.251-.247h-.499v-.753c0-.15-.1-.25-.248-.25h-.5v-5.51h.497c.15 0 .251-.099.251-.25v-.75h.499a.24.24 0 00.248-.201c.026-.125-.024-.224-.123-.276l-6.989-3.504a.35.35 0 00-.223 0L4.66 9.017a.25.25 0 00-.124.273c0 .127.1.204.223.204h.75v.75c0 .148.1.247.249.247h.5v5.512H5.76c-.15 0-.252.1-.252.248v.753H5.01c-.15 0-.25.099-.25.248v.752c-.148 0-.25.1-.25.251 0 .152.1.25.248.25h14.48c.148 0 .25-.098.25-.247 0-.15-.1-.254-.248-.254zM6.006 9.993v-.5h11.98v.5zm10.232.502v5.508h-.996v-5.509zm-2.496 0v5.508h-.998v-5.509zm-2.496 0v5.508h-.996v-5.509zm-2.496 0v5.508h-.995v-5.509zm9.237 6.509H6.009v-.502h11.98v.502z" }));
}
POLIS.DefaultColor = DefaultColor;
var POLIS_default = POLIS;
//# sourceMappingURL=POLIS.js.map
