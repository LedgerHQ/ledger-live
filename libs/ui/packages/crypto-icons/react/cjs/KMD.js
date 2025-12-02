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
var KMD_exports = {};
__export(KMD_exports, {
  default: () => KMD_default
});
module.exports = __toCommonJS(KMD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2b6680";
function KMD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M3.75 11.992a8.25 8.25 0 1016.5.032v-.063a8.3 8.3 0 00-.226-1.886.885.885 0 10-1.721.41 6.484 6.484 0 11-4.8-4.796.885.885 0 00.41-1.722A8.25 8.25 0 003.75 11.992" }), /* @__PURE__ */ React.createElement("path", { d: "M16.17 5.958q-.017.017-.03.036a1.3 1.3 0 00-.351.78v.14c0 .033-.007.064-.01.096a2.357 2.357 0 01-3.06 2.014 3.04 3.04 0 00-2.787.727c-.03.028-.063.052-.092.081a3.053 3.053 0 104.317 4.317 3 3 0 00.342-.416 3.05 3.05 0 00.467-2.453 2 2 0 01-.045-.166q-.002-.012-.007-.025a2.357 2.357 0 012.1-2.878c.017 0 .034-.005.051-.006.05 0 .1-.006.15-.006h.011c.305-.028.59-.162.806-.379q.078-.08.14-.171a1.315 1.315 0 00-2.001-1.69" }));
}
KMD.DefaultColor = DefaultColor;
var KMD_default = KMD;
//# sourceMappingURL=KMD.js.map
