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
var REPV2_exports = {};
__export(REPV2_exports, {
  default: () => REPV2_default
});
module.exports = __toCommonJS(REPV2_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0e0e21";
function REPV2({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.662 11.434l-.93-.604a.19.19 0 01-.059-.253l3.588-6.083a.37.37 0 01.315-.181h.847a.37.37 0 01.315.181l3.588 6.083a.187.187 0 01-.06.253l-.93.604a.183.183 0 01-.255-.062l-3.002-5.09a.092.092 0 00-.158 0l-3.002 5.09a.18.18 0 01-.257.062m8.608.746l1.428 2.421a.38.38 0 01-.116.505L12.2 19.255a.36.36 0 01-.398 0l-6.383-4.148a.375.375 0 01-.117-.505L6.73 12.18a.18.18 0 01.257-.062l.93.604a.19.19 0 01.058.253l-.816 1.384a.095.095 0 00.03.126l4.762 3.093c.03.02.067.02.098 0l4.762-3.093a.094.094 0 00.03-.126l-.816-1.384a.19.19 0 01.06-.253l.93-.604a.18.18 0 01.255.062", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.663 11.62l-.93-.603a.187.187 0 01-.06-.253l3.588-6.083a.37.37 0 01.315-.181h.847a.37.37 0 01.315.181l3.588 6.083a.187.187 0 01-.06.253l-.93.604a.183.183 0 01-.255-.062l-3.002-5.09a.092.092 0 00-.158 0L8.92 11.56a.18.18 0 01-.256.062m8.607.747l1.428 2.421a.38.38 0 01-.116.506L12.2 19.44a.36.36 0 01-.398 0L5.42 15.294a.375.375 0 01-.117-.506l1.428-2.42a.18.18 0 01.256-.062l.93.603a.187.187 0 01.059.253l-.816 1.384a.095.095 0 00.03.126l4.76 3.094c.03.02.068.02.099 0l4.762-3.094a.094.094 0 00.03-.126l-.816-1.384a.19.19 0 01.06-.253l.93-.603a.18.18 0 01.207.007q.03.022.048.054", clipRule: "evenodd" }));
}
REPV2.DefaultColor = DefaultColor;
var REPV2_default = REPV2;
//# sourceMappingURL=REPV2.js.map
