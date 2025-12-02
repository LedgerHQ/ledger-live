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
var EQZ_exports = {};
__export(EQZ_exports, {
  default: () => EQZ_default
});
module.exports = __toCommonJS(EQZ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3a4aff";
function EQZ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 21a9 9 0 110-18 9 9 0 010 18M7.14 9.038c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957-2.174-.957-4.856-.957-4.856.429-4.856.957m4.856 3.873c-2.682 0-4.856-.428-4.856-.957s2.174-.957 4.856-.957 4.856.429 4.856.957c0 .529-2.174.957-4.856.957M7.14 14.963c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957-2.174-.957-4.856-.957-4.856.429-4.856.957", clipRule: "evenodd" }));
}
EQZ.DefaultColor = DefaultColor;
var EQZ_default = EQZ;
//# sourceMappingURL=EQZ.js.map
