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
var POE_exports = {};
__export(POE_exports, {
  default: () => POE_default
});
module.exports = __toCommonJS(POE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function POE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.569 5.799a3.2 3.2 0 00-2.262-.924 3.2 3.2 0 00-2.262.924l-7.392 7.28a.38.38 0 00-.11.286v3.747L4.5 19.125h1.127l1.514-1.49h3.783a.38.38 0 00.283-.122l7.355-7.243.007-.008a3.12 3.12 0 00.931-2.219 3.13 3.13 0 00-.931-2.242zm-4.3.846l.313-.307a2.44 2.44 0 011.724-.702c.648 0 1.259.25 1.725.702.007.007.015.02.029.028a2.36 2.36 0 01.683 1.67c0 .637-.255 1.239-.712 1.698l-.32.315h-2.86l1.878-1.85a.386.386 0 00.014-.536c-.008-.008-.008-.015-.015-.022a.404.404 0 00-.56 0l-1.891 1.863v-2.86zm-6.357 10.23l1.542-1.519h2.86l-1.543 1.52zm4.488-4.427l1.827-1.799h2.859l-1.826 1.799zm2.234.616l-1.703 1.677h-2.858l1.702-1.677zM11.819 9.06l1.833-1.806v2.852l-1.833 1.813zm-2.328 2.292l1.703-1.676v2.851L9.49 14.204zm-2.182 2.15l1.564-1.533v2.851l-1.564 1.533z" }), /* @__PURE__ */ React.createElement("path", { d: "M18.569 5.799a3.2 3.2 0 00-2.262-.924 3.2 3.2 0 00-2.262.924l-7.392 7.28a.38.38 0 00-.11.286v3.747L4.5 19.125h1.127l1.514-1.49h3.783a.38.38 0 00.283-.122l7.355-7.243.007-.008a3.12 3.12 0 00.931-2.219 3.13 3.13 0 00-.931-2.242zm-4.3.846l.313-.307a2.44 2.44 0 011.724-.702c.648 0 1.259.25 1.725.702.007.007.015.02.029.028a2.36 2.36 0 01.683 1.67c0 .637-.255 1.239-.712 1.698l-.32.315h-2.86l1.878-1.85a.386.386 0 00.014-.536c-.008-.008-.008-.015-.015-.022a.404.404 0 00-.56 0l-1.891 1.863v-2.86zm-6.357 10.23l1.542-1.519h2.86l-1.543 1.52zm4.488-4.427l1.827-1.799h2.859l-1.826 1.799zm2.234.616l-1.703 1.677h-2.858l1.702-1.677zM11.819 9.06l1.833-1.806v2.852l-1.833 1.813zm-2.328 2.292l1.703-1.676v2.851L9.49 14.204zm-2.182 2.15l1.564-1.533v2.851l-1.564 1.533z" }));
}
POE.DefaultColor = DefaultColor;
var POE_default = POE;
//# sourceMappingURL=POE.js.map
