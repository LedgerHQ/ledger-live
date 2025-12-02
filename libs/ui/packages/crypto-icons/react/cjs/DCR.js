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
var DCR_exports = {};
__export(DCR_exports, {
  default: () => DCR_default
});
module.exports = __toCommonJS(DCR_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function DCR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.142 13.215h3.315a2.24 2.24 0 002.233-2.247 2.24 2.24 0 00-2.233-2.246h-1.055l-2.26-1.972h3.315a4.2 4.2 0 014.116 3.409 4.224 4.224 0 01-2.534 4.717l2.613 2.282H15.66zm1.618-2.52H9.445a2.24 2.24 0 00-2.234 2.246 2.24 2.24 0 002.234 2.246H10.5l2.259 1.972H9.445a4.2 4.2 0 01-4.116-3.408 4.224 4.224 0 012.534-4.718L5.25 6.75h2.994z" }), /* @__PURE__ */ React.createElement("path", { d: "M11.19 13.26h3.316a2.24 2.24 0 002.233-2.247 2.24 2.24 0 00-2.233-2.246H13.45l-2.26-1.972h3.315a4.2 4.2 0 014.116 3.41 4.224 4.224 0 01-2.534 4.717l2.613 2.281h-2.993zm1.619-2.52H9.494a2.24 2.24 0 00-2.234 2.246 2.24 2.24 0 002.234 2.246h1.055l2.259 1.973H9.494a4.2 4.2 0 01-4.116-3.41 4.224 4.224 0 012.534-4.717L5.3 6.795h2.994z" }));
}
DCR.DefaultColor = DefaultColor;
var DCR_default = DCR;
//# sourceMappingURL=DCR.js.map
