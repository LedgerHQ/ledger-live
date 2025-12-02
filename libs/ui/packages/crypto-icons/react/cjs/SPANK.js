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
var SPANK_exports = {};
__export(SPANK_exports, {
  default: () => SPANK_default
});
module.exports = __toCommonJS(SPANK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ff3b81";
function SPANK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M6.345 16.606v.105H5.237v-2l-.035.111-1.058-.32.598-1.927-.074.108-.918-.61 1.148-1.675-.11.087-.697-.848L5.74 8.32l-.21.08-.397-1.018 1.972-.745-.231.015-.077-1.088 2.064-.142-.186-.042.249-1.063 1.972.449-.124-.071.552-.945 1.72.978-.067-.07.81-.745 1.34 1.415-.03-.057.996-.478.86 1.735-.008-.049 1.093-.17.322 2.004.023-.143 1.094.17-.327 2.035.08-.164.995.479-.92 1.86.134-.142.81.745-1.432 1.512.173-.098.554.944-1.8 1.024.181-.042.25 1.063-1.99.452.155.01-.078 1.089-1.99-.137.101.038-.397 1.018-1.905-.72.12.096-.696.848-1.573-1.255.078.113-.918.611-1.125-1.643.034.108-1.06.32zm0-1.296l.691-.209.537 1.733.599-.398 1.021 1.493.457-.555 1.416 1.13.253-.651 1.707.645.05-.704 1.827.126-.165-.702 1.79-.407-.37-.633 1.598-.909-.548-.502 1.263-1.334-.674-.324.812-1.64-.736-.115.29-1.8-.706.11-.288-1.8-.635.304-.806-1.627-.518.474-1.246-1.317-.357.609-1.579-.898-.163.696-1.776-.404.051.727-1.823.125.27.692-1.718.65.463.561-1.442 1.15.608.404-1.038 1.518.7.211-.542 1.748h.727zm5.437-2.044q0-.414-.292-.633-.291-.224-1.049-.467a7.4 7.4 0 01-1.2-.488q-1.204-.652-1.204-1.757 0-.575.32-1.023.325-.453.928-.707a3.5 3.5 0 011.36-.252q.759 0 1.35.277.592.273.919.774c.221.339.336.736.33 1.14h-1.457q0-.488-.306-.755-.306-.272-.86-.272-.535-.001-.83.229a.71.71 0 00-.297.593q0 .346.345.58.348.233 1.024.438 1.245.375 1.812.93.57.556.569 1.383 0 .92-.695 1.447-.694.52-1.87.521a3.6 3.6 0 01-1.487-.297q-.67-.302-1.024-.823a2.1 2.1 0 01-.35-1.208H9.28q0 1.173 1.399 1.174.52 0 .811-.21a.7.7 0 00.292-.594m4.448-4.348l-1.405 5.139-1.157-.082.875-5.297zm-1.226 5.674l-.365 1.816-1.54-.45.354-1.741z" }));
}
SPANK.DefaultColor = DefaultColor;
var SPANK_default = SPANK;
//# sourceMappingURL=SPANK.js.map
