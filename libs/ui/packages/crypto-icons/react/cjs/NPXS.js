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
var NPXS_exports = {};
__export(NPXS_exports, {
  default: () => NPXS_default
});
module.exports = __toCommonJS(NPXS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f5d100";
function NPXS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.993 3.017c-4.95 0-8.98 4.03-8.98 8.98s4.03 8.986 8.987 8.986 8.986-4.03 8.986-8.987-4.036-8.979-8.992-8.979zm0 17.273c-4.57 0-8.294-3.717-8.294-8.294.008-4.569 3.725-8.287 8.294-8.287s8.294 3.718 8.294 8.295c0 4.569-3.718 8.287-8.294 8.287z" }), /* @__PURE__ */ React.createElement("path", { d: "M7.344 8.01l.66-.661 3.516 3.515-.66.66zm5.114 5.115l.66-.66 3.516 3.515-.66.66zm-1.121-1.126l.66-.66.666.664-.66.662zm1.13-1.107l3.516-3.514.66.66-3.515 3.516zM7.37 15.983l3.514-3.514.661.66-3.514 3.515z" }));
}
NPXS.DefaultColor = DefaultColor;
var NPXS_default = NPXS;
//# sourceMappingURL=NPXS.js.map
