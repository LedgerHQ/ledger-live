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
var TKS_exports = {};
__export(TKS_exports, {
  default: () => TKS_default
});
module.exports = __toCommonJS(TKS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#895af8";
function TKS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M13.328 10.688q.18-.012.36 0c1.11.074 1.62 1.582 2.324 1.5a6.1 6.1 0 01-2.25 1.162 1.5 1.5 0 01-1.627-.975v3l4.365-2.49V9zm-2.168-.008a1.54 1.54 0 01-.555-1.117v-.06c0-.87 1.402-2.25 1.447-2.25.046.045 1.448 1.387 1.448 2.25v.067a1.5 1.5 0 01-.45 1.02l3.45-1.852L12 6.533 7.5 8.715zm.735 1.725a1.5 1.5 0 01-1.627.982 6.1 6.1 0 01-2.25-1.162c.704.053 1.207-1.463 2.324-1.5q.18-.01.36 0L7.5 9v3.893l4.403 2.542z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3a9 9 0 100 18 9 9 0 000-18M6.975 8.393L12 5.954l5.032 2.438v4.792L12 16.087l-5.025-2.902zm10.073 6.75l-5.01 2.895-5.07-2.925v-.278l5.07 2.925 5.01-2.895zm0-.563l-5.01 2.895-5.07-2.925v-.3l5.07 2.933 5.01-2.895zm0-.562l-5.01 2.895-5.07-2.925v-.278l5.07 2.932 5.01-2.894z" }));
}
TKS.DefaultColor = DefaultColor;
var TKS_default = TKS;
//# sourceMappingURL=TKS.js.map
