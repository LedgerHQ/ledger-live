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
var BCN_exports = {};
__export(BCN_exports, {
  default: () => BCN_default
});
module.exports = __toCommonJS(BCN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f04086";
function BCN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.044 12.73q-.708-.783-2.04-.972v-.019c.778-.126 1.39-.444 1.805-.954.421-.506.65-1.145.646-1.803 0-1.096-.352-1.84-1.083-2.427-.73-.585-1.827-.777-3.313-.777H8.45V11H5.227v2h8.795c.692 0 1.212.049 1.555.326.344.276.52.634.52 1.163s-.174.98-.52 1.264c-.345.282-.865.47-1.555.47h-3.018v-1.556H8.449v3.555h5.795c1.474 0 2.6-.384 3.382-.982.78-.598 1.147-1.48 1.147-2.564a2.86 2.86 0 00-.729-1.946M13.7 10.995h-2.695V7.773H13.7c1.386 0 2.078.54 2.078 1.61s-.692 1.612-2.078 1.612" }));
}
BCN.DefaultColor = DefaultColor;
var BCN_default = BCN;
//# sourceMappingURL=BCN.js.map
