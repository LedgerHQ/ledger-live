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
var MAID_exports = {};
__export(MAID_exports, {
  default: () => MAID_default
});
module.exports = __toCommonJS(MAID_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#5592d7";
function MAID({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.975 9.527v9.73l-8.217-4.73c-2.43-1.423-2.276-2.308-2.276-4.23l8.447 4.884v-4.462l2.045-1.192" }), /* @__PURE__ */ React.createElement("path", { d: "M13.93 15.18l-8.447-4.884 8.215-4.73c2.43-1.385 3.125-.808 4.822.154l-8.447 4.884 3.857 2.23z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M10.073 10.604L18.52 5.72v9.46c0 2.809-.848 3.116-2.545 4.078v-9.73l-3.897 2.23-2.006-1.154", opacity: 0.2 }));
}
MAID.DefaultColor = DefaultColor;
var MAID_default = MAID;
//# sourceMappingURL=MAID.js.map
