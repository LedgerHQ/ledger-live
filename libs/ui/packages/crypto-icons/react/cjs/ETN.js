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
var ETN_exports = {};
__export(ETN_exports, {
  default: () => ETN_default
});
module.exports = __toCommonJS(ETN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#23bee2";
function ETN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M14.91 10.102l2.428-2.56a6.951 6.951 0 01-8.69 10.543l6.18-3.184 1.006-.519-.932-.644-.666-.46 1.942-.992.966-.494-.865-.654zm-5.82 4.15l-2.264 2.385a6.92 6.92 0 01-1.78-4.64A6.951 6.951 0 0115.68 6.098L9.173 9.453l-1.007.52.932.643.666.46-1.942.993-.966.493.865.655zm-2.688 2.833l-.469.493a8.2 8.2 0 01-2.183-5.582C3.75 7.45 7.451 3.75 12 3.75c1.87 0 3.597.625 4.982 1.678l-.676.349A7.53 7.53 0 0012 4.429c-4.174 0-7.57 3.395-7.57 7.567a7.53 7.53 0 001.973 5.088zm11.361-9.99l.471-.495a8.2 8.2 0 012.016 5.396c0 4.547-3.701 8.246-8.25 8.246a8.2 8.2 0 01-4.69-1.466l.693-.357A7.53 7.53 0 0012 19.562c4.174 0 7.57-3.394 7.57-7.566a7.53 7.53 0 00-1.807-4.9zm-9.631 5.58l2.955-1.51-1.602-1.107 8.872-4.573-4.465 4.7 1.976 1.495-2.955 1.51 1.602 1.107-8.872 4.574 4.465-4.701z" }));
}
ETN.DefaultColor = DefaultColor;
var ETN_default = ETN;
//# sourceMappingURL=ETN.js.map
