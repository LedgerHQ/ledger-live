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
var ARY_exports = {};
__export(ARY_exports, {
  default: () => ARY_default
});
module.exports = __toCommonJS(ARY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#343434";
function ARY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.938 15.832a.636.636 0 00.427-.645v.825a.68.68 0 01-.446.645l-5.691 2.05a.6.6 0 01-.447 0L6.09 16.658a.675.675 0 01-.446-.645v-.825c0 .284.176.55.446.645l5.71 2.05a.6.6 0 00.446 0zm0-1.46a.65.65 0 00.427-.646v.825a.68.68 0 01-.446.645l-5.691 2.05a.6.6 0 01-.447 0L6.09 15.197a.675.675 0 01-.446-.645v-.835c0 .294.176.55.446.654l5.71 2.05a.6.6 0 00.446 0zm0-1.47a.66.66 0 00.437-.637v.825a.68.68 0 01-.447.645l-5.691 2.05a.6.6 0 01-.446 0L6.09 13.726a.675.675 0 01-.446-.645v-.825c0 .285.176.55.446.645l5.71 2.05a.6.6 0 00.446 0zM5.625 7.995a.675.675 0 01.446-.645l5.701-2.058a.6.6 0 01.446 0L17.92 7.35a.675.675 0 01.446.645v3.624a.68.68 0 01-.446.645l-5.71 2.05a.6.6 0 01-.446 0l-5.692-2.05a.675.675 0 01-.446-.645z" }));
}
ARY.DefaultColor = DefaultColor;
var ARY_default = ARY;
//# sourceMappingURL=ARY.js.map
