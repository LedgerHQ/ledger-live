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
var MLN_exports = {};
__export(MLN_exports, {
  default: () => MLN_default
});
module.exports = __toCommonJS(MLN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function MLN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M6.47 15.093l3.954 2.319v1.297L5.25 15.664V7.72L12 3.75l6.75 3.971v7.943l-5.174 3.045V17.41l3.953-2.318-1.02-.59.133-.231 1.008.582v-5.89l-5.115 3.032v8.67L12 21l-.536-.334v-8.67L6.35 8.965v5.888l1.007-.581.133.232zm5.382-9.982L6.885 8.024 12 11.057l5.115-3.033-4.996-2.93v1.202h-.268zm0 1.944h.267v1.242h-.268zm0 2h.267v1.243l-.134.061-.133-.06zm4.17 4.838l-.134.232-1.077-.622.134-.232zm-1.7-1l-.133.232-1.077-.623.015-.145.119-.085zm-6.344 1l1.076-.622.134.233-1.076.62zm1.7-1l1.076-.622.12.086.013.146-1.076.621z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M6.47 14.718l3.954 2.319v1.297L5.25 15.289V7.346L12 3.375l6.75 3.971v7.943l-5.174 3.045v-1.298l3.953-2.318-1.02-.59.133-.231 1.008.582v-5.89l-5.115 3.032v8.67l-.535.334-.536-.334v-8.67L6.35 8.59v5.888l1.007-.581.133.232zm5.382-9.982L6.885 7.649 12 10.681l5.115-3.032-4.996-2.93V5.92h-.268zm0 1.944h.267v1.242h-.268zm0 2h.267v1.243l-.134.061-.133-.06zm4.17 4.838l-.134.232-1.077-.622.134-.232zm-1.7-1l-.133.232-1.077-.623.015-.145.119-.085zm-6.344 1l1.076-.622.134.233-1.076.62zm1.7-1l1.076-.622.12.086.013.146-1.076.621z", clipRule: "evenodd" }));
}
MLN.DefaultColor = DefaultColor;
var MLN_default = MLN;
//# sourceMappingURL=MLN.js.map
