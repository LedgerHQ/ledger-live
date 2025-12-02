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
var SPHTX_exports = {};
__export(SPHTX_exports, {
  default: () => SPHTX_default
});
module.exports = __toCommonJS(SPHTX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00b098";
function SPHTX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 8.918v-.267h6.313v.267zm0-.776v-.267h6.313v.267zm2.662 7.98v-6.67h.254v6.67zm.736 0v-6.67h.252v6.67zm11.424-.546l-2.849-3.01.178-.188 2.849 3.009zm-6.933-7.701l2.849 3.01-.179.188-2.848-3.009zm6.413 8.25l-2.849-3.01.179-.189 2.848 3.01zM11.87 8.424l2.849 3.009-.18.189-2.848-3.009zM15.936 12l.18-.189 3.206-3.387.178.189L16.294 12l-.179.189-.34.36-.18.189-3.205 3.387-.179-.189 3.207-3.387.178-.189zm-.34-.738l3.206-3.387.179.189-3.206 3.387-.179.189-.34.36-.18.189-3.205 3.387-.18-.189L14.899 12l.178-.189.342-.36z" }));
}
SPHTX.DefaultColor = DefaultColor;
var SPHTX_default = SPHTX;
//# sourceMappingURL=SPHTX.js.map
