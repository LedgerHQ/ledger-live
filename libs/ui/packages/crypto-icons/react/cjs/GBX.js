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
var GBX_exports = {};
__export(GBX_exports, {
  default: () => GBX_default
});
module.exports = __toCommonJS(GBX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1666af";
function GBX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.774 8.255v1.544H8.25a2.64 2.64 0 00-1.44.458c-.52.369-.81.922-.81 1.745s.29 1.377.81 1.745c.42.297.983.458 1.44.458h1.5v1.545h-1.5a4.1 4.1 0 01-2.29-.73c-.921-.654-1.459-1.678-1.459-3.018s.538-2.364 1.459-3.018a4.1 4.1 0 012.29-.73zm-3.75 4.636v-1.545h3.75v4.404h-1.499v-2.859zm6.226-3.096V8.25h5.25v7.5h-6.751V9.8h1.5v4.404H18V9.796z" }), /* @__PURE__ */ React.createElement("path", { d: "M11.774 8.255v1.544H8.25a2.64 2.64 0 00-1.44.458c-.52.369-.81.922-.81 1.745s.29 1.377.81 1.745c.42.297.983.458 1.44.458h1.5v1.545h-1.5a4.1 4.1 0 01-2.29-.73c-.921-.654-1.459-1.678-1.459-3.018s.538-2.364 1.459-3.018a4.1 4.1 0 012.29-.73zm-3.75 4.636v-1.545h3.75v4.404h-1.499v-2.859zm6.226-3.096V8.25h5.25v7.5h-6.751V9.8h1.5v4.404H18V9.796z" }));
}
GBX.DefaultColor = DefaultColor;
var GBX_default = GBX;
//# sourceMappingURL=GBX.js.map
