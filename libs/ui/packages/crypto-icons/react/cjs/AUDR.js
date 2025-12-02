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
var AUDR_exports = {};
__export(AUDR_exports, {
  default: () => AUDR_default
});
module.exports = __toCommonJS(AUDR_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#34318a";
function AUDR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.068 9.948l2.707 1.44 1.44-.72-3.442-1.865V5.52l6.618 3.435 1.44-.72-8.475-4.443a.634.634 0 00-.929.562v4.55c.002.44.25.843.64 1.044m10.317-.764a.63.63 0 00-.72-.114l-9.597 4.982a1.18 1.18 0 00-.64 1.052v4.542a.634.634 0 00.928.562l9.576-4.968c.4-.207.648-.623.64-1.072V9.63a.63.63 0 00-.187-.447m-1.152 4.904l-8.46 4.392v-3.283l8.46-4.392z" }));
}
AUDR.DefaultColor = DefaultColor;
var AUDR_default = AUDR;
//# sourceMappingURL=AUDR.js.map
