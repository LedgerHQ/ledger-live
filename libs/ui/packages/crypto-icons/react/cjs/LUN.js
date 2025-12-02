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
var LUN_exports = {};
__export(LUN_exports, {
  default: () => LUN_default
});
module.exports = __toCommonJS(LUN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f55749";
function LUN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.86 4.536a.29.29 0 01.279 0L18.308 8a.27.27 0 010 .47l-5.366 3.026a1.24 1.24 0 00-.73-.405V9.446a1.21 1.21 0 001.025-1.183c0-.664-.552-1.202-1.234-1.202s-1.234.538-1.234 1.202c0 .59.439 1.081 1.016 1.182v1.648a1.24 1.24 0 00-.72.402L5.699 8.483a.269.269 0 010-.471l6.162-3.474zm6.466 4.365a.284.284 0 01.38.098.3.3 0 01.039.137l.005 6.724a.27.27 0 01-.14.236l-5.973 3.367c-.186.105-.418-.026-.418-.235l-.005-5.77a1.24 1.24 0 00.74-.416l1.492.836a1.2 1.2 0 00-.027.471c.094.658.719 1.115 1.393 1.023.675-.093 1.145-.701 1.05-1.359s-.72-1.115-1.394-1.022a1.23 1.23 0 00-.841.508l-1.463-.82a1.15 1.15 0 00-.019-.859zm-13.07.234c0-.159.133-.272.279-.272q.075 0 .14.037l5.186 2.924a1.16 1.16 0 00-.018.855l-1.461.82a1.23 1.23 0 00-.842-.508c-.675-.093-1.298.365-1.393 1.022-.096.657.375 1.265 1.05 1.358s1.297-.365 1.393-1.022a1.2 1.2 0 00-.027-.472l1.491-.836c.187.22.447.366.733.416l-.005 5.77c0 .21-.232.34-.418.236l-5.975-3.368a.27.27 0 01-.139-.235z" }));
}
LUN.DefaultColor = DefaultColor;
var LUN_default = LUN;
//# sourceMappingURL=LUN.js.map
