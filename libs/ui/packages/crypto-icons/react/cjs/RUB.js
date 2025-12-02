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
var RUB_exports = {};
__export(RUB_exports, {
  default: () => RUB_default
});
module.exports = __toCommonJS(RUB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#64d1ff";
function RUB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M7.5 11.429h1.323V5.25h3.41q.949 0 1.733.223.783.223 1.342.678.558.455.875 1.152t.317 1.666-.335 1.685c-.211.46-.523.868-.914 1.19a3.8 3.8 0 01-1.36.708 6 6 0 01-1.695.232h-1.883v1.957h3v1.278h-3v2.731h-1.49v-2.73H7.5v-1.28h1.323v-1.956H7.5zm4.733 0q1.286 0 2.021-.61.737-.611.737-1.85t-.736-1.801-2.022-.563h-1.92v4.823z", clipRule: "evenodd" }));
}
RUB.DefaultColor = DefaultColor;
var RUB_default = RUB;
//# sourceMappingURL=RUB.js.map
