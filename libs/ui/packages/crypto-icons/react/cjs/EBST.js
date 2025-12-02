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
var EBST_exports = {};
__export(EBST_exports, {
  default: () => EBST_default
});
module.exports = __toCommonJS(EBST_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1693d4";
function EBST({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.196 12.43q-.029-.405-.004-.81h-2.1L3.75 9.748h4.87A6.04 6.04 0 0114.217 6c3.333 0 6.034 2.687 6.034 6s-2.701 6-6.034 6a6.04 6.04 0 01-5.574-3.696H3.75l2.342-1.873zm9.457-.318q0-.934-.253-1.63a3.3 3.3 0 00-.701-1.162 2.9 2.9 0 00-1.064-.703 3.7 3.7 0 00-1.337-.237q-.78 0-1.453.265a3.5 3.5 0 00-1.165.747 3.5 3.5 0 00-.773 1.162q-.282.682-.282 1.515 0 .846.282 1.513.282.668.78 1.127.5.46 1.18.711a4.2 4.2 0 001.489.251q1.952 0 2.979-1.378l-1.158-.918a2.05 2.05 0 01-.737.652q-.448.237-1.098.237-.376 0-.724-.129a2.2 2.2 0 01-.622-.351 1.7 1.7 0 01-.636-1.213h5.279q.014-.115.014-.23zm-1.736-.776H12.36q.058-.731.6-1.198t1.324-.467q.418 0 .73.137.31.136.513.366t.297.53q.095.31.093.632", clipRule: "evenodd" }));
}
EBST.DefaultColor = DefaultColor;
var EBST_default = EBST;
//# sourceMappingURL=EBST.js.map
