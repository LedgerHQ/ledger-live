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
var ATM_exports = {};
__export(ATM_exports, {
  default: () => ATM_default
});
module.exports = __toCommonJS(ATM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#346fce";
function ATM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.193 14.206l.717 1.348a3.277 3.277 0 01-1.355 4.431l-.093.05a3.277 3.277 0 01-4.432-1.355l-2.417-4.546a3.277 3.277 0 011.194-4.34L8.09 8.445a3.277 3.277 0 011.355-4.431l.093-.05A3.277 3.277 0 0113.97 5.32l2.418 4.546a3.277 3.277 0 01-1.194 4.34m0 0l-1.7-3.198A3.277 3.277 0 009.06 9.653l-.093.049q-.082.045-.16.091l1.7 3.2a3.277 3.277 0 004.431 1.354l.093-.05z", clipRule: "evenodd" }));
}
ATM.DefaultColor = DefaultColor;
var ATM_default = ATM;
//# sourceMappingURL=ATM.js.map
