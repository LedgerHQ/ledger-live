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
var VIVO_exports = {};
__export(VIVO_exports, {
  default: () => VIVO_default
});
module.exports = __toCommonJS(VIVO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#408af1";
function VIVO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.287 6.957a1.18 1.18 0 011.642-.402c.563.352.74 1.102.395 1.677-1.278 2.129-2.72 4.356-3.923 6.057-1.755 2.483-2.135 3.336-3.401 3.336s-1.551-.753-3.356-3.342C7.57 12.745 6.226 10.686 4.69 8.256a1.235 1.235 0 01.356-1.686 1.18 1.18 0 011.652.363c1.517 2.402 4.945 7.407 5.31 7.854.383-.453 4.03-5.75 5.278-7.83" }));
}
VIVO.DefaultColor = DefaultColor;
var VIVO_default = VIVO;
//# sourceMappingURL=VIVO.js.map
