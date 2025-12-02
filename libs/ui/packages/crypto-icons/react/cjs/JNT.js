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
var JNT_exports = {};
__export(JNT_exports, {
  default: () => JNT_default
});
module.exports = __toCommonJS(JNT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0050db";
function JNT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 19.5a2.7 2.7 0 01-1.383-.379l-3.98-2.34a2.84 2.84 0 01-1.387-2.445V9.663a2.85 2.85 0 011.388-2.444l3.979-2.34c.421-.248.9-.378 1.389-.379.484 0 .96.13 1.377.379l3.98 2.34a2.84 2.84 0 011.387 2.445v4.672a2.85 2.85 0 01-1.387 2.445l-3.98 2.34A2.7 2.7 0 0112 19.5m-2.289-4.822l-.737.75a2.02 2.02 0 001.467.617c1.148-.002 2.08-.948 2.081-2.118v-.638c.315.185.673.282 1.037.281a2 2 0 001.473-.609l-.736-.75c-.195.2-.46.313-.737.313a1.05 1.05 0 01-1.037-1.056V7.946h-1.037v5.988c0 .585-.464 1.058-1.038 1.058a1.03 1.03 0 01-.736-.314" }));
}
JNT.DefaultColor = DefaultColor;
var JNT_default = JNT;
//# sourceMappingURL=JNT.js.map
