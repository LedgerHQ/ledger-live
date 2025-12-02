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
var FUEL_exports = {};
__export(FUEL_exports, {
  default: () => FUEL_default
});
module.exports = __toCommonJS(FUEL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4096d0";
function FUEL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M19.149 7.5h-4.871l-1.445 3.623H8.278V9.257h4.555L13.5 7.5H6.602a.32.32 0 00-.325.32v3.302h-1.11L4.5 12.878h1.777v3.298c0 .179.147.324.329.324h3.338l.667-1.756H8.278v-1.867h3.778L10.61 16.5h2.222l1.556-3.623h4.785c.18 0 .326-.144.326-.321v-4.71a.35.35 0 00-.351-.346m-1.538 3.345a.28.28 0 01-.28.277h-2.275l.777-1.864h1.496a.28.28 0 01.283.276z" }));
}
FUEL.DefaultColor = DefaultColor;
var FUEL_default = FUEL;
//# sourceMappingURL=FUEL.js.map
