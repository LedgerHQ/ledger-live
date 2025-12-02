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
var JUSDC_exports = {};
__export(JUSDC_exports, {
  default: () => JUSDC_default
});
module.exports = __toCommonJS(JUSDC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2775c9";
function JUSDC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 20.813A8.81 8.81 0 013.188 12 8.81 8.81 0 0112 3.188a8.812 8.812 0 110 17.625M11.475 8.73a1.935 1.935 0 00-1.838 1.852c0 .908.556 1.5 1.733 1.748l.825.195c.803.188 1.133.457 1.133.915s-.578.908-1.328.908a1.43 1.43 0 01-1.35-.683.51.51 0 00-.457-.292H9.75a.26.26 0 00-.21.307 2.05 2.05 0 001.958 1.56v.63a.529.529 0 001.057 0v-.637a1.965 1.965 0 001.943-1.936c0-.952-.548-1.5-1.845-1.777l-.75-.165c-.75-.187-1.103-.435-1.103-.855s.45-.885 1.2-.885a1.23 1.23 0 011.193.607.6.6 0 00.54.346h.352a.315.315 0 00.232-.375 1.99 1.99 0 00-1.784-1.5v-.518a.529.529 0 10-1.058 0zM5.393 12a6.59 6.59 0 004.5 6.247h.104a.337.337 0 00.338-.337v-.157A.71.71 0 009.9 17.1a5.52 5.52 0 010-10.237.7.7 0 00.435-.646v-.172a.314.314 0 00-.42-.3A6.59 6.59 0 005.393 12m13.215 0a6.59 6.59 0 00-4.5-6.24h-.113a.353.353 0 00-.352.353v.112a.75.75 0 00.457.675 5.52 5.52 0 010 10.23.75.75 0 00-.45.668v.127a.352.352 0 00.465.33A6.59 6.59 0 0018.608 12" }));
}
JUSDC.DefaultColor = DefaultColor;
var JUSDC_default = JUSDC;
//# sourceMappingURL=JUSDC.js.map
