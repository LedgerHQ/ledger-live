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
var XMO_exports = {};
__export(XMO_exports, {
  default: () => XMO_default
});
module.exports = __toCommonJS(XMO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f60";
function XMO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M21 12a9 9 0 01-9 9A9 9 0 014.772 6.635l1.47 1.47A6.9 6.9 0 005.046 12a6.95 6.95 0 006.947 6.947A6.953 6.953 0 0018.94 12a6.95 6.95 0 00-1.196-3.895l1.47-1.47A8.9 8.9 0 0121 12" }), /* @__PURE__ */ React.createElement("path", { d: "M16.978 12A4.983 4.983 0 0112 16.978 4.983 4.983 0 017.021 12c0-.865.225-1.715.654-2.467L12 13.856l4.325-4.325c.428.752.654 1.603.654 2.469" }), /* @__PURE__ */ React.createElement("path", { d: "M17.885 5.194L12 11.072 7.514 6.593l-1.4-1.4A8.93 8.93 0 0112 3c2.25 0 4.304.823 5.885 2.194" }));
}
XMO.DefaultColor = DefaultColor;
var XMO_default = XMO;
//# sourceMappingURL=XMO.js.map
