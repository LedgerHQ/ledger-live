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
var ENJ_exports = {};
__export(ENJ_exports, {
  default: () => ENJ_default
});
module.exports = __toCommonJS(ENJ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#624dbf";
function ENJ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.735 6.75c.37.043.745.066 1.111.132.725.137.962.482.84 1.182-.05.283-.233.458-.524.505a4 4 0 01-.524.038q-3.572.006-7.144.02-.54.002-1.067.09c-1.18.184-1.624.652-1.723 1.79-.045.535-.045.535.514.535h9.77a.85.85 0 01.43.113c.435.265.327.68.302 1.064-.02.307-.212.477-.543.538q-.21.032-.42.029H8.014c-.36 0-.354 0-.325.34.025.312.045.62.124.922.147.563.508.912 1.09 1.068.647.175 1.314.213 1.98.218 2.326.014 4.647.01 6.973.01.296 0 .572.037.745.297.336.501.075 1.2-.513 1.38-.504.156-1.032.194-1.556.199-2.182.037-4.365.043-6.547 0a12 12 0 01-2.004-.222c-1.556-.308-2.331-1.064-2.593-2.558-.06-.345-.094-.694-.138-1.04v-2.727c.03-.27.054-.538.09-.803.206-1.693.997-2.525 2.734-2.893.618-.133 1.25-.161 1.872-.223q3.386-.005 6.789-.004" }));
}
ENJ.DefaultColor = DefaultColor;
var ENJ_default = ENJ;
//# sourceMappingURL=ENJ.js.map
