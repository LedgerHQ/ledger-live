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
var BLOCK_exports = {};
__export(BLOCK_exports, {
  default: () => BLOCK_default
});
module.exports = __toCommonJS(BLOCK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#101341";
function BLOCK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.266 5.25h7.672L19.875 12l-3.937 6.75h-7.74l3.87-6.75zm4.073 2.375L14.852 12l-2.512 4.375h2.24L17.093 12 14.58 7.625z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.085 8.27L6.908 12l2.157 3.698-1.379 2.406L4.125 12l3.592-6.158z", clipRule: "evenodd", opacity: 0.5 }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.266 5.25h7.672L19.875 12l-3.937 6.75h-7.74l3.87-6.75zm4.073 2.375L14.852 12l-2.512 4.375h2.24L17.093 12 14.58 7.625z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.085 8.27L6.908 12l2.157 3.698-1.379 2.406L4.125 12l3.592-6.158z", clipRule: "evenodd", opacity: 0.5 }));
}
BLOCK.DefaultColor = DefaultColor;
var BLOCK_default = BLOCK;
//# sourceMappingURL=BLOCK.js.map
