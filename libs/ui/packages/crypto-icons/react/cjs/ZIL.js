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
var ZIL_exports = {};
__export(ZIL_exports, {
  default: () => ZIL_default
});
module.exports = __toCommonJS(ZIL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#49c1bf";
function ZIL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.2, d: "M6.765 5.477l8.336 4.037 2.134-.961-8.301-4.037z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M15.1 9.504l2.135-.96v2.148l-2.134.961zm0 9.963v-6.702l2.135-.972v6.714z" }), /* @__PURE__ */ React.createElement("path", { d: "M6.765 5.48v2.172l5.77 2.803-5.77 2.857v2.142l8.336 4.03v-2.156L9.44 14.575l5.66-2.91v-2.15z" }));
}
ZIL.DefaultColor = DefaultColor;
var ZIL_default = ZIL;
//# sourceMappingURL=ZIL.js.map
