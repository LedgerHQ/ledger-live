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
var SGB_exports = {};
__export(SGB_exports, {
  default: () => SGB_default
});
module.exports = __toCommonJS(SGB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function SGB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M6.7 2.6c.1 0 .1.1.2.1.4.3.8.7 1.2 1 .5.5.9.8 1.3 1.2.4.3.8.7 1.3 1 .4.3.8.7 1.2 1s.7.6 1.1.9c.1.1.3.2.4.3v.1c-.5.7-1.1 1.4-1.6 2.1-.5.6-.9 1.2-1.4 1.8-.1.2-.2.3-.4.5v-.1c-.1-.4-.3-.9-.4-1.3-.2-.5-.3-1-.5-1.4-.2-.6-.4-1.2-.6-1.7S8.1 7 8 6.5c-.2-.5-.3-.9-.5-1.4-.1-.4-.2-.8-.4-1.2-.1-.3-.2-.7-.3-1 0-.1-.1-.2-.1-.3m9.2 10.9c-.2 0-.4-.1-.7-.1-.4 0-.7-.1-1.1-.1-.2 0-.5-.1-.7-.1s-.5-.1-.7-.1-.5-.1-.7-.1c-.3 0-.7-.1-1-.1-.2 0-.5-.1-.7-.1-.1 0-.1 0 0-.1.2-.2.4-.5.6-.7.4-.5.8-1 1.2-1.6.4-.5.7-.9 1.1-1.4.2-.2.3-.4.5-.6h.1c.3.6.5 1.1.8 1.7.3.7.6 1.3.9 2 0 .5.2.9.4 1.4 0 0 .1 0 0 0m-.1.3c-.1.1-.3.2-.4.2-.4.3-.9.6-1.3.8s-.7.4-1.1.7c-.5.3-1 .6-1.6 1l-1.5.9c-.1.1-.2.2-.4.2 0-.4.1-.7.1-1.1 0-.3.1-.7.1-1s.1-.7.1-1c0-.2.1-.5.1-.7s0-.4.1-.6c0-.1 0-.1.1-.1.4.1.8.1 1.2.2s.8.1 1.2.2.8.1 1.3.2c.4 0 .8.1 1.1.2.3-.2.6-.2.9-.1q-.15 0 0 0m-6.1-.1c0 .2 0 .4-.1.6 0 .3-.1.6-.1.9s-.1.6-.1.9-.1.6-.1.9-.1.5-.1.8-.1.6-.1.9c-.1.2-.1.4-.1.7 0 .2 0 .4-.1.6v.2s0 .1-.1.1c-.4.1-.7.2-1.1.3-.3.1-.7.2-1 .3-.4.1-.9.3-1.3.4h-.1c0-.1.1-.1.1-.2.3-.5.5-.9.8-1.4.3-.6.7-1.2 1-1.8l.9-1.5c.2-.3.4-.7.6-1 .3-.5.5-.9.8-1.4 0-.1.1-.2.2-.3q-.15 0 0 0m6.5-.4c-.1-.1-.1-.2-.2-.3-.1-.2-.2-.5-.3-.7-.2-.5-.5-1-.7-1.5 0-.1-.1-.2-.1-.3v-.1c.6-.3 1.3-.6 1.9-.9.3-.1.6-.3.9-.4h.1c-.6 1.3-1.1 2.7-1.6 4.2M18 9.2v.1c.1.3.1.7.2 1 .1.7.3 1.4.4 2l-.1-.1c-.4-.3-.7-.7-1.1-1-.1-.1-.1-.1-.1-.3.2-.5.3-.9.5-1.4.1 0 .1-.1.2-.3" }));
}
SGB.DefaultColor = DefaultColor;
var SGB_default = SGB;
//# sourceMappingURL=SGB.js.map
