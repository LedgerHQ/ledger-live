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
var MDS_exports = {};
__export(MDS_exports, {
  default: () => MDS_default
});
module.exports = __toCommonJS(MDS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1e252c";
function MDS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.665 11.692a1.13 1.13 0 110-2.261 1.13 1.13 0 010 2.26m2.774 0a1.13 1.13 0 110-2.261 1.13 1.13 0 010 2.26m-2.775 2.774a1.13 1.13 0 110-2.26 1.13 1.13 0 010 2.26m2.774 0a1.13 1.13 0 110-2.26 1.13 1.13 0 010 2.26m2.774-3.083a.823.823 0 110-1.645.823.823 0 010 1.645m0 2.775a.822.822 0 110-1.644.822.822 0 010 1.644m-8.424-2.775a.822.822 0 110-1.643.822.822 0 010 1.643m0 2.775a.822.822 0 110-1.645.822.822 0 010 1.645m2.876 2.773a.823.823 0 11-.05-1.644.823.823 0 01.05 1.644m2.774 0a.822.822 0 11-.05-1.644.822.822 0 01.05 1.644M10.665 8.61a.822.822 0 11-.05-1.644.822.822 0 01.05 1.644m2.774 0a.822.822 0 11-.05-1.643.822.822 0 01.05 1.643m-2.774-3.083a.514.514 0 110-1.026.514.514 0 110 1.027m2.774 0a.513.513 0 110-1.026.514.514 0 010 1.027m5.548 5.549a.514.514 0 110-1.028.514.514 0 010 1.028m0 2.774a.513.513 0 110-1.027.513.513 0 010 1.027M5.014 11.076a.514.514 0 110-1.028.514.514 0 010 1.028m0 2.774a.514.514 0 110-1.027.514.514 0 010 1.027m5.65 5.65a.514.514 0 110-1.028.514.514 0 010 1.028m2.774 0a.514.514 0 110-1.028.514.514 0 010 1.028" }));
}
MDS.DefaultColor = DefaultColor;
var MDS_default = MDS;
//# sourceMappingURL=MDS.js.map
