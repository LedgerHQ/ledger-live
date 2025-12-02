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
var PPP_exports = {};
__export(PPP_exports, {
  default: () => PPP_default
});
module.exports = __toCommonJS(PPP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#348f8d";
function PPP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.483 5.283a1 1 0 010 1.384l-2.347 2.407a1 1 0 01-.257.188.89.89 0 01-1.081-.159l-2.339-2.395-4.503 4.62 1.087 1.111a.88.88 0 01-.005 1.215.83.83 0 01-1.187.006l-1.73-1.765a.88.88 0 010-1.224l.013-.011.01-.012 5.718-5.865h.001l.02-.02a.86.86 0 011.116-.106 1 1 0 01.15.126l2.238 2.29 1.746-1.79a.94.94 0 011.351 0m1.394 6.826a.874.874 0 010 1.22l-.011.012-.012.011-5.74 5.885a.862.862 0 01-1.316-.09l-2.187-2.238-1.735 1.783a.94.94 0 01-.925.257.97.97 0 01-.678-.694 1 1 0 01.251-.947l2.347-2.406a.94.94 0 01.493-.271.9.9 0 01.84.252l2.344 2.398 4.495-4.608-1.087-1.112a.88.88 0 01.005-1.215.83.83 0 011.186-.005l1.705 1.744.002.001.002.002z" }));
}
PPP.DefaultColor = DefaultColor;
var PPP_default = PPP;
//# sourceMappingURL=PPP.js.map
