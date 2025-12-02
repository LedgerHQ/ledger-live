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
var ELLA_exports = {};
__export(ELLA_exports, {
  default: () => ELLA_default
});
module.exports = __toCommonJS(ELLA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#396a28";
function ELLA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M13.555 9.909L12 8.355l-1.565 1.564-1.623-1.623L12 3.75l3.21 4.504zm-3.662.553L8.355 12l1.554 1.555-1.617 1.617L3.75 12l4.493-3.187zm4.188 3.103L15.645 12l-1.548-1.548 1.67-1.67L20.25 12l-4.533 3.202zm-3.629.533L12 15.645l1.537-1.537 1.637 1.637L12 20.25l-3.153-4.548zM12 9.395L14.604 12 12 14.604 9.396 12z", clipRule: "evenodd" }));
}
ELLA.DefaultColor = DefaultColor;
var ELLA_default = ELLA;
//# sourceMappingURL=ELLA.js.map
