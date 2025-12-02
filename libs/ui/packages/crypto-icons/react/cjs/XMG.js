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
var XMG_exports = {};
__export(XMG_exports, {
  default: () => XMG_default
});
module.exports = __toCommonJS(XMG_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function XMG({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593q-.585-1.09-.996-1.631-.41-.54-.731-.675a2 2 0 00-.626-.157 8 8 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554q.41 0 .75-.195.34-.196.588-.49.263-.306.462-.655.213-.37.373-.767z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593q-.585-1.09-.996-1.631-.41-.54-.731-.675a2 2 0 00-.626-.157 8 8 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554q.41 0 .75-.195.34-.196.588-.49.263-.306.462-.655.213-.37.373-.767z", clipRule: "evenodd" }));
}
XMG.DefaultColor = DefaultColor;
var XMG_default = XMG;
//# sourceMappingURL=XMG.js.map
