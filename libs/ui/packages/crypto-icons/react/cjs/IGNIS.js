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
var IGNIS_exports = {};
__export(IGNIS_exports, {
  default: () => IGNIS_default
});
module.exports = __toCommonJS(IGNIS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f9c011";
function IGNIS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.109 4.5c1.139.665 2.21 1.436 3.338 2.119l-4.158 7.253c-.553-.968-1.07-1.956-1.615-2.93.785-2.156 1.682-4.274 2.435-6.442M7.5 19.5c2.354-4.282 4.8-8.516 7.128-12.81q.934 1.64 1.872 3.278c-1.805 3.174-3.623 6.34-5.413 9.522-1.196 0-2.39-.015-3.587.01m3.812-.017c.997-1.707 1.937-3.443 2.947-5.142.602.77 1.213 1.537 1.811 2.31a460 460 0 01-4.758 2.832" }), /* @__PURE__ */ React.createElement("path", { d: "M11.109 4.5c1.139.665 2.21 1.436 3.338 2.119l-4.158 7.253c-.553-.968-1.07-1.956-1.615-2.93.785-2.156 1.682-4.274 2.435-6.442M7.5 19.5c2.354-4.282 4.8-8.516 7.128-12.81q.934 1.64 1.872 3.278c-1.805 3.174-3.623 6.34-5.413 9.522-1.196 0-2.39-.015-3.587.01m3.812-.017c.997-1.707 1.937-3.443 2.947-5.142.602.77 1.213 1.537 1.811 2.31a460 460 0 01-4.758 2.832" }));
}
IGNIS.DefaultColor = DefaultColor;
var IGNIS_default = IGNIS;
//# sourceMappingURL=IGNIS.js.map
