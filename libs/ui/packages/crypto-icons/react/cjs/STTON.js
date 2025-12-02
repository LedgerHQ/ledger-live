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
var STTON_exports = {};
__export(STTON_exports, {
  default: () => STTON_default
});
module.exports = __toCommonJS(STTON_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function STTON({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M4.395 8.514c-.915-1.575.22-3.55 2.042-3.55h11.381c1.817 0 2.954 1.966 2.048 3.54L12.998 20.45a.962.962 0 01-1.666.004zm2.042-1.8a.612.612 0 00-.53.92l6.254 10.763 6.188-10.765a.612.612 0 00-.53-.917z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M11.398 11.724v-4.2L9.54 8.596v4.046l1.86 1.204 1.53-1.029z" }), /* @__PURE__ */ React.createElement("path", { d: "M13.214 8.596l-1.509.875 1.51 1.203v2.493l1.662-.918V9.624z" }));
}
STTON.DefaultColor = DefaultColor;
var STTON_default = STTON;
//# sourceMappingURL=STTON.js.map
