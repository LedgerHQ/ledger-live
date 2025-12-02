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
var EMC2_exports = {};
__export(EMC2_exports, {
  default: () => EMC2_default
});
module.exports = __toCommonJS(EMC2_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0cf";
function EMC2({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.4, d: "M5.92 14.37h3.298l-1.42 2.88H4.5zm1.88-3.81h3.298l-1.416 2.872h-3.3zm1.879-3.81h3.298L11.56 9.624H8.263z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.6, d: "M9.208 14.37h3.298l-1.42 2.879H7.787zm1.88-3.81h3.297l-1.416 2.871H9.671zm1.878-3.81h3.299l-1.417 2.872H11.55z" }), /* @__PURE__ */ React.createElement("path", { d: "M12.443 14.37h3.298l-1.42 2.879h-3.298zm1.88-3.81h3.298l-1.416 2.871h-3.299zm1.879-3.81H19.5l-1.417 2.872h-3.297z" }));
}
EMC2.DefaultColor = DefaultColor;
var EMC2_default = EMC2;
//# sourceMappingURL=EMC2.js.map
