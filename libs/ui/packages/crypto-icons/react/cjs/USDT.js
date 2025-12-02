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
var USDT_exports = {};
__export(USDT_exports, {
  default: () => USDT_default
});
module.exports = __toCommonJS(USDT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00a478";
function USDT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M13.473 12.501c-.083.006-.508.031-1.457.031a32 32 0 01-1.478-.031v.002c-2.916-.128-5.092-.636-5.092-1.243s2.176-1.115 5.092-1.245v1.983c.19.013.737.045 1.491.045.906 0 1.36-.037 1.444-.045v-1.982c2.91.13 5.081.638 5.081 1.244 0 .607-2.171 1.113-5.081 1.242m0-2.692V8.034h4.06V5.328H6.479v2.706h4.06v1.774c-3.3.152-5.782.806-5.782 1.589s2.482 1.436 5.782 1.588v5.687h2.935v-5.688c3.295-.152 5.77-.805 5.77-1.587 0-.783-2.475-1.436-5.77-1.588", clipRule: "evenodd" }));
}
USDT.DefaultColor = DefaultColor;
var USDT_default = USDT;
//# sourceMappingURL=USDT.js.map
