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
var BNB_exports = {};
__export(BNB_exports, {
  default: () => BNB_default
});
module.exports = __toCommonJS(BNB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f3ba2f";
function BNB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.087 10.803L12 7.89l2.915 2.915L16.61 9.11 12 4.5 7.392 9.108zM4.5 12l1.695-1.695L7.89 12l-1.695 1.695zm4.587 1.197L12 16.11l2.915-2.915 1.695 1.695L12 19.5l-4.608-4.608-.002-.002zM16.11 12l1.695-1.695L19.5 12l-1.695 1.695zm-2.391-.002h.002V12L12 13.72l-1.718-1.717-.003-.003.003-.002.3-.302.147-.146L12 10.28 13.72 12z" }));
}
BNB.DefaultColor = DefaultColor;
var BNB_default = BNB;
//# sourceMappingURL=BNB.js.map
