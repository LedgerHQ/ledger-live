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
var UNITY_exports = {};
__export(UNITY_exports, {
  default: () => UNITY_default
});
module.exports = __toCommonJS(UNITY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f58634";
function UNITY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.99 17.076h.003q1.338-.162 2.25-.81 1.208-.867 1.208-2.2 0-1.124-.883-1.892-.885-.77-2.399-.932a23 23 0 00-1.452-.112q-2.04-.124-2.653-.56a1.3 1.3 0 01-.36-.392.9.9 0 01-.117-.458c0-.42.243-.776.733-1.056q.732-.42 1.858-.421c.712 0 1.418.121 2.085.36 2.87 1.023 5.61 4.599 7.435 7.16-1.488.903-3.513 1.46-5.745 1.46q-.987 0-1.963-.147m-3.21-1.457c-2.619-.956-3.766-3.32-2.472-5.614.036.322.155.632.347.9q.36.503 1.056.825c1.616.702 4.588.254 5.812 1.146q.618.45.618 1.15 0 .88-.862 1.442-.86.56-2.24.56a6.6 6.6 0 01-2.257-.409z" }), /* @__PURE__ */ React.createElement("path", { d: "M19.458 14.183v-4.39c.493.666.768 1.41.768 2.195s-.275 1.527-.768 2.195m-1.237-5.595l.004 5.596c-1.757-2.495-4.383-5.634-7.61-6.682a8 8 0 00-1.72-.358c1-.246 2.027-.37 3.058-.367 2.505 0 4.751.702 6.268 1.81", opacity: 0.5 }));
}
UNITY.DefaultColor = DefaultColor;
var UNITY_default = UNITY;
//# sourceMappingURL=UNITY.js.map
