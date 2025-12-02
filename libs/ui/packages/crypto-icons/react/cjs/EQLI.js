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
var EQLI_exports = {};
__export(EQLI_exports, {
  default: () => EQLI_default
});
module.exports = __toCommonJS(EQLI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#c9a35e";
function EQLI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.52 15.32a.28.28 0 01-.25.158H4.215a.28.28 0 01-.236-.137.28.28 0 01-.008-.279l5.553-10.01c.1-.179.387-.179.487 0l4.329 7.784a.3.3 0 01-.008.28.26.26 0 01-.236.135H12.83a.29.29 0 01-.243-.143L9.774 7.993 6.627 13.81H7.83a.29.29 0 01.236.128.28.28 0 01.014.272l-.558 1.109zm12.506-.258a.26.26 0 01-.008.28.26.26 0 01-.235.135h-8.335a.28.28 0 01-.279-.279V14.09a.28.28 0 01.28-.279h5.93l-3.14-5.796-.595 1.187c-.1.186-.407.186-.5 0l-.558-1.108a.3.3 0 010-.25l1.387-2.783a.3.3 0 01.243-.15.29.29 0 01.251.142zm-3.613 1.109l1.38 2.504a.28.28 0 010 .279.26.26 0 01-.235.136H6.44a.28.28 0 01-.243-.143.28.28 0 01.007-.28l2.225-3.612 2.217-3.885a.27.27 0 01.251-.143.26.26 0 01.244.15l.558 1.11a.27.27 0 01-.008.264l-2.818 4.865h6.253l-.58-.966a.26.26 0 01-.008-.28.28.28 0 01.244-.142h1.387c.101 0 .194.057.244.143" }));
}
EQLI.DefaultColor = DefaultColor;
var EQLI_default = EQLI;
//# sourceMappingURL=EQLI.js.map
