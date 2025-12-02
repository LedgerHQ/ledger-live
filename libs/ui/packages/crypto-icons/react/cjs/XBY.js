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
var XBY_exports = {};
__export(XBY_exports, {
  default: () => XBY_default
});
module.exports = __toCommonJS(XBY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#56f4f1";
function XBY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 5.637c0-.011.157-.012 2.189-.01l2.189.002 1.245 2.095 1.266 2.13.02.036.199-.338c.108-.186.196-.341.195-.346l-1.058-1.785a233 233 0 01-1.054-1.785c0-.01.329-.011 2.304-.011 1.28 0 2.305.003 2.305.008 0 .014-4.887 8.322-4.898 8.325-.008.001-.723-1.207-2.457-4.153A881 881 0 014.5 5.637m10.605-.007c0-.003.99-.005 2.198-.005H19.5l-.003.016c-.002.01-1.097 1.876-2.433 4.147-1.62 2.75-2.434 4.13-2.445 4.131s-.24-.38-1.009-1.675l-1.002-1.682c-.007-.003-.4.665-.397.674 0 .003.453.765 1.003 1.692q.508.844.998 1.698c-.007.027-2.202 3.747-2.211 3.749-.014.003-2.197-3.705-2.192-3.724.003-.008 5.215-8.887 5.295-9.02z" }));
}
XBY.DefaultColor = DefaultColor;
var XBY_default = XBY;
//# sourceMappingURL=XBY.js.map
