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
var YOYOW_exports = {};
__export(YOYOW_exports, {
  default: () => YOYOW_default
});
module.exports = __toCommonJS(YOYOW_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#21a5de";
function YOYOW({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.118 12.431c.255.273.409.637.409 1.036 0 .847-.696 1.533-1.554 1.533a1.543 1.543 0 01-1.553-1.533c0-.399.155-.763.409-1.036a.558.558 0 01-.897-.431.54.54 0 01.118-.338 1.56 1.56 0 01-1.05.404 1.56 1.56 0 01-1.05-.404.54.54 0 01.118.338.55.55 0 01-.555.547.56.56 0 01-.341-.116c.253.273.408.637.408 1.036 0 .847-.696 1.533-1.553 1.533a1.544 1.544 0 01-1.554-1.533c0-.399.155-.763.409-1.036A.558.558 0 016.986 12a.54.54 0 01.117-.338 1.56 1.56 0 01-1.05.404A1.543 1.543 0 014.5 10.533C4.5 9.686 5.195 9 6.053 9s1.553.686 1.553 1.533c0 .385-.145.755-.408 1.036a.557.557 0 01.897.431.54.54 0 01-.118.338c.276-.251.645-.404 1.05-.404s.773.153 1.05.404A.54.54 0 019.959 12a.557.557 0 11.896-.431 1.52 1.52 0 01-.408-1.036C10.447 9.686 11.142 9 12 9s1.553.686 1.553 1.533c0 .385-.146.755-.409 1.036a.557.557 0 01.897.431.54.54 0 01-.117.338c.276-.251.645-.404 1.05-.404s.772.153 1.05.404a.54.54 0 01-.119-.338.558.558 0 11.897-.431 1.52 1.52 0 01-.409-1.036c0-.847.696-1.533 1.554-1.533s1.553.686 1.553 1.533-.695 1.533-1.553 1.533a1.56 1.56 0 01-1.05-.404.54.54 0 01.118.338.55.55 0 01-.556.547.56.56 0 01-.34-.116z" }));
}
YOYOW.DefaultColor = DefaultColor;
var YOYOW_default = YOYOW;
//# sourceMappingURL=YOYOW.js.map
