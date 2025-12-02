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
var GUSD_exports = {};
__export(GUSD_exports, {
  default: () => GUSD_default
});
module.exports = __toCommonJS(GUSD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00dcfa";
function GUSD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M14.534 3.75c-2.903 0-5.368 2.232-5.678 5.105-2.875.31-5.106 2.776-5.106 5.678a5.72 5.72 0 005.717 5.717c2.902 0 5.377-2.232 5.677-5.105 2.874-.31 5.106-2.776 5.106-5.678a5.72 5.72 0 00-5.716-5.717m4.376 6.357a4.45 4.45 0 01-3.727 3.728v-3.728zM5.09 13.893a4.45 4.45 0 013.727-3.737v3.727H5.09zm8.754 1.29a4.42 4.42 0 01-4.377 3.776 4.42 4.42 0 01-4.377-3.775zm.049-5.076v3.776h-3.786v-3.776zm5.017-1.29h-8.754a4.42 4.42 0 014.377-3.776 4.42 4.42 0 014.377 3.775z" }));
}
GUSD.DefaultColor = DefaultColor;
var GUSD_default = GUSD;
//# sourceMappingURL=GUSD.js.map
