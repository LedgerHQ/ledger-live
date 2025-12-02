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
var WINGS_exports = {};
__export(WINGS_exports, {
  default: () => WINGS_default
});
module.exports = __toCommonJS(WINGS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0dc9f7";
function WINGS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.2, d: "M14.178 11.432l-2.284 1.773-.935-3.244L5.541 8.51l7.11.365z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M6.203 17.622L18.44 8.125l1.06 2.36-1.391-.385-.049 2.448z" }), /* @__PURE__ */ React.createElement("path", { d: "M17.097 12.963l-3.56-6.121L4.5 6.378l6.887 1.845 1.868 6.368z" }));
}
WINGS.DefaultColor = DefaultColor;
var WINGS_default = WINGS;
//# sourceMappingURL=WINGS.js.map
