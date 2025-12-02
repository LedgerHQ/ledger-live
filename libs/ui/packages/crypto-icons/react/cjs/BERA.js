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
var BERA_exports = {};
__export(BERA_exports, {
  default: () => BERA_default
});
module.exports = __toCommonJS(BERA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#deb69a";
function BERA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.93 11.155a1 1 0 01-.035-.154l-.013-.072-.036-.155c.218-.344 1.262-2.14.074-3.293-1.318-1.28-2.859.398-2.859.398l.005.007a3.53 3.53 0 00-2.174-.007c-.009-.01-1.544-1.673-2.858-.398-1.315 1.276.105 3.34.112 3.351a1 1 0 00-.035.148C7.968 11.864 7 12.136 7 13.675s1.013 2.804 3.08 2.804h.85c.003.006.353.522 1.07.521.666 0 1.106-.516 1.11-.52h.81c2.067 0 3.08-1.237 3.08-2.805 0-1.433-.84-1.768-1.07-2.52" }));
}
BERA.DefaultColor = DefaultColor;
var BERA_default = BERA;
//# sourceMappingURL=BERA.js.map
