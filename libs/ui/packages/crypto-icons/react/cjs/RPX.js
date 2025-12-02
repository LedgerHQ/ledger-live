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
var RPX_exports = {};
__export(RPX_exports, {
  default: () => RPX_default
});
module.exports = __toCommonJS(RPX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#8d181b";
function RPX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.897 11.799c.54 0 .978.427.978.956a.967.967 0 01-.978.956.98.98 0 01-.909-.603h-2.79l-1.029 1.83c-.17.301-.634.212-.674-.13l-.231-1.955-.855 6.34c-.057.422-.688.403-.717-.022l-.701-10.25-.743 6.79c-.045.406-.64.427-.712.025l-.787-4.317-.363 1.422a.36.36 0 01-.349.267H4.485a.356.356 0 01-.36-.353c0-.195.161-.352.36-.352h3.27l.704-2.754c.095-.369.636-.35.705.024l.637 3.502.914-8.36c.047-.428.689-.416.718.013l.736 10.755.76-5.643c.056-.411.667-.407.716.006l.436 3.686.588-1.047a.36.36 0 01.316-.182h3.003a.98.98 0 01.909-.604" }));
}
RPX.DefaultColor = DefaultColor;
var RPX_default = RPX;
//# sourceMappingURL=RPX.js.map
