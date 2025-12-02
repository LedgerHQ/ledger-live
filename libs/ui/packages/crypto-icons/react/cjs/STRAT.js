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
var STRAT_exports = {};
__export(STRAT_exports, {
  default: () => STRAT_default
});
module.exports = __toCommonJS(STRAT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1387c9";
function STRAT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.04 13.78l7.195-4.188-7.195-4.263-7.124 4.263zm-7.505-2.19a.57.57 0 00.282.493l7.22 4.206 7.34-4.341a.553.553 0 01.831.48v1.97a.56.56 0 01-.27.477l-7.618 4.547a.55.55 0 01-.56.002L3.945 14.83a.397.397 0 01.097-.724.4.4 0 01.298.04l7.698 4.526 7.385-4.409v-1.425l-7.105 4.202a.55.55 0 01-.556.003l-7.338-4.275a1.36 1.36 0 01-.674-1.178V9.735a.473.473 0 01.71-.41l.456.267-.573.343a.39.39 0 01-.588-.273.4.4 0 01.188-.407l7.814-4.677a.55.55 0 01.563-.001l7.658 4.537a.56.56 0 01-.004.961l-7.659 4.458a.55.55 0 01-.555 0l-7.695-4.525a.312.312 0 00.471-.273v1.856z" }));
}
STRAT.DefaultColor = DefaultColor;
var STRAT_default = STRAT;
//# sourceMappingURL=STRAT.js.map
