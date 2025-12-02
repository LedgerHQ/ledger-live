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
var ELA_exports = {};
__export(ELA_exports, {
  default: () => ELA_default
});
module.exports = __toCommonJS(ELA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function ELA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.4, d: "M8.25 16.59L12 14.473V18.7zm0-6.75L12 7.723v4.227z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.7, d: "M19.5 14.423l-3.75 2.164v-4.264zm0-6.75l-3.75 2.164V5.572z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.8, d: "M8.25 16.587v-4.262L12 14.477zm0-6.75V5.575L12 7.727z" }), /* @__PURE__ */ React.createElement("path", { d: "M15.75 16.587L12 14.478l3.75-2.155zm0-6.75L12 7.728l3.75-2.156z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.6, d: "M15.75 16.587L12 18.701v-4.223zm0-6.75L12 11.951V7.728z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M8.25 12.326v4.262L4.5 14.424zm0-6.75v4.262L4.5 7.674z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.4, d: "M8.25 16.453L12 14.338v4.226zm0-6.75L12 7.588v4.226z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.7, d: "M19.5 14.286l-3.75 2.165v-4.265zm0-6.75l-3.75 2.165V5.436z" }), /* @__PURE__ */ React.createElement("path", { d: "M8.25 16.45v-4.262L12 14.341zm0-6.75V5.439L12 7.591zm7.5 6.75L12 14.343l3.75-2.156zm0-6.75L12 7.592l3.75-2.156z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.6, d: "M15.75 16.45L12 18.565v-4.222zm0-6.75L12 11.815V7.592z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M8.25 12.189v4.262L4.5 14.287zm0-6.75v4.262L4.5 7.538z" }));
}
ELA.DefaultColor = DefaultColor;
var ELA_default = ELA;
//# sourceMappingURL=ELA.js.map
