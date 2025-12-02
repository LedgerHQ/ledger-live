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
var MDA_exports = {};
__export(MDA_exports, {
  default: () => MDA_default
});
module.exports = __toCommonJS(MDA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#01a64f";
function MDA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.497 5.994c.912.975 1.378 2.199 1.378 3.63 0 1.453-.466 2.678-1.379 3.653a4.53 4.53 0 01-2.614 1.39v.85h2.067v.934h-2.088v.497h2.088v.871h-2.067V19.5h-1.764v-1.68H9.07v-.872h2.068v-.497H9.071v-.934h2.048v-.872a4.53 4.53 0 01-2.595-1.39c-.932-.975-1.399-2.2-1.399-3.651 0-1.473.446-2.697 1.379-3.652.931-.975 2.088-1.452 3.507-1.452 1.398 0 2.553.477 3.486 1.494m-1.905 5.54c.384-.498.588-1.142.588-1.93 0-.768-.203-1.41-.629-1.909-.405-.518-.932-.767-1.54-.767-.629 0-1.155.249-1.561.747-.407.498-.61 1.12-.61 1.909 0 .808.204 1.452.61 1.95.406.497.932.746 1.56.746.65 0 1.196-.248 1.582-.746" }));
}
MDA.DefaultColor = DefaultColor;
var MDA_default = MDA;
//# sourceMappingURL=MDA.js.map
