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
var PTRN_exports = {};
__export(PTRN_exports, {
  default: () => PTRN_default
});
module.exports = __toCommonJS(PTRN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#273658";
function PTRN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M5.19 10l-2.85 9.95h2.97L8.16 10zm10.55 2a2 2 0 00-2-2h-2.6l-1.15 4.01h3.75c1.11 0 2-.91 2-2.01m-2.01-7.94h-.89L13.9.36h-2.97l-1.06 3.7H4.19l-.85 2.97h10.4c2.74 0 4.98 2.23 4.98 4.98s-2.23 4.98-4.98 4.98h-4.6l-.85 2.97h5.45c4.38 0 7.95-3.56 7.95-7.95s-3.56-7.95-7.95-7.95zM4.25 23.64h2.97l1.06-3.69H5.31z", clipRule: "evenodd" }));
}
PTRN.DefaultColor = DefaultColor;
var PTRN_default = PTRN;
//# sourceMappingURL=PTRN.js.map
