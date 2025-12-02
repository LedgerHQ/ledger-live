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
var SABI_exports = {};
__export(SABI_exports, {
  default: () => SABI_default
});
module.exports = __toCommonJS(SABI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function SABI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { stroke: "#000", strokeWidth: 0.48, d: "M9.73 3.033H4.391A11.7 11.7 0 0112 .24C18.495.24 23.76 5.505 23.76 12S18.495 23.76 12 23.76c-2.585 0-4.975-.834-6.916-2.248H9.73a1.058 1.058 0 000-2.116H2.856a12 12 0 01-1.118-1.649h11.599a1.058 1.058 0 000-2.116H.81a12 12 0 01-.422-1.755H4.09a1.058 1.058 0 000-2.116H.242c.017-.824.118-1.627.296-2.401h12.826a1.058 1.058 0 000-2.116H1.242q.494-1.116 1.198-2.094h7.29a1.058 1.058 0 000-2.116zm-.152 9.785c0 .584.474 1.058 1.058 1.058h8.728a1.058 1.058 0 000-2.116h-8.728c-.584 0-1.058.473-1.058 1.058zm-2.25-1.058a1.059 1.059 0 10-.001 2.117 1.059 1.059 0 000-2.117zm5.7-8.727a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117zm0 16.363a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117z" }));
}
SABI.DefaultColor = DefaultColor;
var SABI_default = SABI;
//# sourceMappingURL=SABI.js.map
