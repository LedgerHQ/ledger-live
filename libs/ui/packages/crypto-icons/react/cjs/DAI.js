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
var DAI_exports = {};
__export(DAI_exports, {
  default: () => DAI_default
});
module.exports = __toCommonJS(DAI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f4b731";
function DAI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M6.583 6h4.914c2.989 0 5.254 1.587 6.097 3.896h1.531v1.395h-1.208q.035.331.035.674v.034q0 .386-.045.758h1.218v1.395h-1.56C16.7 16.429 14.452 18 11.497 18H6.584v-3.848H4.875v-1.395h1.708V11.29H4.875V9.896h1.708zm1.373 8.152v2.596h3.54c2.185 0 3.809-1.04 4.564-2.596zm8.525-1.395H7.955V11.29h8.528q.046.346.047.708v.034a5 5 0 01-.05.723m-4.984-5.508c2.195 0 3.823 1.068 4.574 2.646H7.956V7.25z", clipRule: "evenodd" }));
}
DAI.DefaultColor = DefaultColor;
var DAI_default = DAI;
//# sourceMappingURL=DAI.js.map
