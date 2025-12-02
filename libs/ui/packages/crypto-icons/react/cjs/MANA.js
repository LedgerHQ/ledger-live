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
var MANA_exports = {};
__export(MANA_exports, {
  default: () => MANA_default
});
module.exports = __toCommonJS(MANA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ff2d55";
function MANA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.595 8.65L4.31 14.991A8.248 8.248 0 0112 3.75 8.25 8.25 0 0120.25 12a8.23 8.23 0 01-2.912 6.29H6.662c-.467-.4-.89-.85-1.262-1.34h9.422v-3.572l2.973 3.572h.805l-3.782-4.537-1.044 1.253zm5.224-1.6a2.063 2.063 0 000 4.125 2.064 2.064 0 000-4.125M9.596 5.557a1.032 1.032 0 10-.055 2.063 1.032 1.032 0 00.055-2.063M7.492 18.909h9.017A8.23 8.23 0 0112 20.25a8.23 8.23 0 01-4.508-1.341m5.882-4.76l-1.82 2.182H4.98a8.3 8.3 0 01-.668-1.34h5.285V9.615z" }));
}
MANA.DefaultColor = DefaultColor;
var MANA_default = MANA;
//# sourceMappingURL=MANA.js.map
