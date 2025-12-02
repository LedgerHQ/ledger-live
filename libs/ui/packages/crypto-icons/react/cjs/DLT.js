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
var DLT_exports = {};
__export(DLT_exports, {
  default: () => DLT_default
});
module.exports = __toCommonJS(DLT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f4ae95";
function DLT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.855 7.468l-4.57 9.756h7.587a.55.55 0 01.505.341l.008.019a.48.48 0 01-.023.42.72.72 0 01-.626.371H6.672a.6.6 0 01-.35-.109l-.042-.028a.655.655 0 01-.217-.818l5.392-11.362a.9.9 0 01.235-.307.52.52 0 01.67-.008.4.4 0 01.1.13l5.47 11.438a.7.7 0 01.044.5.43.43 0 01-.411.317H17.5a.66.66 0 01-.596-.387L12.187 7.47a.18.18 0 00-.165-.109.18.18 0 00-.167.107" }));
}
DLT.DefaultColor = DefaultColor;
var DLT_default = DLT;
//# sourceMappingURL=DLT.js.map
