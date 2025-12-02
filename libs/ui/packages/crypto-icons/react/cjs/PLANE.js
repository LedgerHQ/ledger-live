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
var PLANE_exports = {};
__export(PLANE_exports, {
  default: () => PLANE_default
});
module.exports = __toCommonJS(PLANE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function PLANE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M20.966 5.847L3.091 9.518a.5.5 0 00-.147.924l4.934 2.813.894 4.906a.5.5 0 00.78.32l3.287-2.317 3.48 2.46a.5.5 0 00.757-.232l4.463-11.878.001-.002m-5.172 10.922l3.664-9.75-8.727 6.165 1.824 1.295zm-1.526-7.309L8.886 13.21l.48 2.632.592-2.126a.5.5 0 01.193-.276zm-4.72 6.73l1.852-1.305-1.243-.882zm-1.783-4.488l9.298-4.815L4.592 10.23z", clipRule: "evenodd" }));
}
PLANE.DefaultColor = DefaultColor;
var PLANE_default = PLANE;
//# sourceMappingURL=PLANE.js.map
