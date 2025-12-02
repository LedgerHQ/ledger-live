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
var CNY_exports = {};
__export(CNY_exports, {
  default: () => CNY_default
});
module.exports = __toCommonJS(CNY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ff4314";
function CNY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M6.878 5.625H17.24v1.444H6.878zm-1.155 4.23h12.805v1.46h-3.922v4.88c0 .375.162.562.502.562h1.629c.178 0 .326-.115.414-.331.104-.231.178-.94.208-2.108l1.391.433c-.104 1.631-.296 2.599-.562 2.903-.267.288-.651.447-1.17.447h-2.353c-1.052 0-1.57-.534-1.57-1.589v-5.197h-2.19v.288c-.074 1.834-.488 3.306-1.243 4.404-.74 1.01-1.925 1.805-3.583 2.368l-.829-1.27c1.599-.55 2.665-1.242 3.227-2.051.563-.896.858-2.036.918-3.45v-.29H5.724z", clipRule: "evenodd" }));
}
CNY.DefaultColor = DefaultColor;
var CNY_default = CNY;
//# sourceMappingURL=CNY.js.map
