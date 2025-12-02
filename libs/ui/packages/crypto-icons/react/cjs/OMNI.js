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
var OMNI_exports = {};
__export(OMNI_exports, {
  default: () => OMNI_default
});
module.exports = __toCommonJS(OMNI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1c347a";
function OMNI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.549 5.166a8.2 8.2 0 00-2.393 2.397V5.166zm11.253 2.332a8.2 8.2 0 00-2.35-2.332h2.35zm-2.316 11.313a8.2 8.2 0 002.316-2.31v2.31zm-11.33-2.374a8.2 8.2 0 002.358 2.374H5.156zM19.5 12c0 4.136-3.364 7.5-7.5 7.5-4.135 0-7.5-3.364-7.5-7.5 0-4.135 3.364-7.5 7.5-7.5s7.5 3.364 7.5 7.5M12 17.469A5.476 5.476 0 0017.469 12 5.476 5.476 0 0012 6.531 5.476 5.476 0 006.531 12 5.476 5.476 0 0012 17.469" }));
}
OMNI.DefaultColor = DefaultColor;
var OMNI_default = OMNI;
//# sourceMappingURL=OMNI.js.map
