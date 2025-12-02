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
var SOL_exports = {};
__export(SOL_exports, {
  default: () => SOL_default
});
module.exports = __toCommonJS(SOL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function SOL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M2.41 7.77h15.68a.5.5 0 00.37-.16l3.43-3.67a.4.4 0 00-.3-.67H5.91a.5.5 0 00-.37.16L2.11 7.1a.4.4 0 00.3.67m0 13h15.68a.5.5 0 00.37-.16l3.43-3.67a.4.4 0 00-.3-.67H5.91a.5.5 0 00-.37.16L2.11 20.1a.4.4 0 00.3.67m19.18-6.5H5.91a.5.5 0 01-.37-.16l-3.43-3.67a.4.4 0 01.3-.67h15.68a.5.5 0 01.37.16l3.43 3.67a.4.4 0 01-.3.67" }));
}
SOL.DefaultColor = DefaultColor;
var SOL_default = SOL;
//# sourceMappingURL=SOL.js.map
