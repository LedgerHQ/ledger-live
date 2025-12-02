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
var SHIFT_exports = {};
__export(SHIFT_exports, {
  default: () => SHIFT_default
});
module.exports = __toCommonJS(SHIFT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#964b9c";
function SHIFT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.36 11.997l-3.354 3.353h6.706z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M8.625 12l3.354-3.353H5.272z", opacity: 0.7 }), /* @__PURE__ */ React.createElement("path", { d: "M12.006 15.35l3.345-3.344-3.36-3.362-6.708 6.707 6.707 6.707 6.707-6.707z", opacity: 0.4 }), /* @__PURE__ */ React.createElement("path", { d: "M12.021 1.942L5.32 8.645h6.66l-3.334 3.334 3.376 3.376 6.707-6.706z", opacity: 0.8 }));
}
SHIFT.DefaultColor = DefaultColor;
var SHIFT_default = SHIFT;
//# sourceMappingURL=SHIFT.js.map
