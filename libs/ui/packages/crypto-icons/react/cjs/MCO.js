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
var MCO_exports = {};
__export(MCO_exports, {
  default: () => MCO_default
});
module.exports = __toCommonJS(MCO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#103f68";
function MCO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.985 3.757l7.14 4.112v8.25l-7.132 4.124-.058-.014-7.06-4.11v-8.25l7.06-4.112zm-.023.853L5.625 8.3v7.388l6.336 3.689.774-.448 5.64-3.243V8.301l-5.64-3.263zm-5.355 7.958l1.875-1.403 1.659 1.06v1.904l1.255 1.21-.001.566-1.21 1.133h-1.02zm5.927 3.339l-.002-.57 1.25-1.208v-1.905l1.64-1.072 1.872 1.417-2.545 4.456h-1.008zm-1.777-3.683l-.611-1.598h3.628l-.598 1.598.177 1.787-1.4.003-1.384.002zm1.196-2.036l-3.449-.002.642-2.864h5.597l.675 2.868z" }));
}
MCO.DefaultColor = DefaultColor;
var MCO_default = MCO;
//# sourceMappingURL=MCO.js.map
