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
var BCBC_exports = {};
__export(BCBC_exports, {
  default: () => BCBC_default
});
module.exports = __toCommonJS(BCBC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#004ab5";
function BCBC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.362 5.845a6.566 6.566 0 108.062 9.32l-5.746-3.176 2.331-6.139a6.57 6.57 0 00-4.647-.005m.41 1.18a5.32 5.32 0 013.763.004L11.647 12l4.653 2.573a5.317 5.317 0 11-6.529-7.547m2.201-3.29a8.3 8.3 0 012.61.533L11.647 12l7.238 4a8.272 8.272 0 11-6.912-12.266m5.647 2.86q.298 0 .552.07.75.207 1.012.931.162.441.071.864a1.54 1.54 0 01-.39.758 1.68 1.68 0 011.013.256q.432.273.636.834.288.794-.175 1.451-.459.646-1.641 1.076l-3.123 1.137-2.198-6.04 2.95-1.074q.725-.263 1.293-.264m-.457 1.249q-.27 0-.625.13l-1.39.505.518 1.424 1.39-.506q.518-.187.718-.466.204-.279.073-.633-.127-.353-.459-.429a1 1 0 00-.226-.025m1.171 2.341q-.284.004-.666.143l-1.63.593.543 1.493 1.63-.594q.552-.2.762-.482.218-.284.081-.665-.18-.492-.72-.488" }));
}
BCBC.DefaultColor = DefaultColor;
var BCBC_default = BCBC;
//# sourceMappingURL=BCBC.js.map
