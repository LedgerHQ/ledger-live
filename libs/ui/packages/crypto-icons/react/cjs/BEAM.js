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
var BEAM_exports = {};
__export(BEAM_exports, {
  default: () => BEAM_default
});
module.exports = __toCommonJS(BEAM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0b76ff";
function BEAM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.67 10.238v-1.65l-5.37 3.127L11.985 6v3.75l1.688 2.925-.683.405-1.005-1.77-1.08 1.92-.75-.308 1.83-3.172V6l-3.63 6.18L3.3 10.088V12l4.5 1.11L4.95 18h7.035v-2.017H8.392l1.343-2.356.81.203-.81 1.425h4.5l-.675-1.193.893-.067 1.147 1.988h-3.615V18h7.065l-2.43-4.148 4.08-.3v-1.657l-4.59 1.133 4.583-1.178v-1.5l-4.973 2.018zM14.145 13.5l-.81.203.795-.203zm-.255-.45l-.75.3.75-.307z" }));
}
BEAM.DefaultColor = DefaultColor;
var BEAM_default = BEAM;
//# sourceMappingURL=BEAM.js.map
