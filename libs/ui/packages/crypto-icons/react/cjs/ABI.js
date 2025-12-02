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
var ABI_exports = {};
__export(ABI_exports, {
  default: () => ABI_default
});
module.exports = __toCommonJS(ABI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function ABI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 24c6.627 0 12-5.372 12-12 0-6.627-5.373-12-12-12-4.033 0-7.601 1.99-9.777 5.04h4.44a.96.96 0 010 1.92H1.106Q.783 7.657.55 8.4h13.173a.96.96 0 110 1.92H.116A12 12 0 000 11.915h4.687a.96.96 0 110 1.92H.139q.12.781.337 1.525h13.246a.96.96 0 110 1.92H1.221q.426.868.982 1.651h4.46a.96.96 0 110 1.92H3.897A11.96 11.96 0 0012 24.002m4.358-6.72a.96.96 0 110-1.92.96.96 0 010 1.92m-.96-7.92a.96.96 0 101.92 0 .96.96 0 00-1.92 0M8.188 19.9a.96.96 0 101.92 0 .96.96 0 00-1.92 0m.96-12.938a.96.96 0 110-1.92.96.96 0 010 1.92m.042 5.915c0 .53.43.96.96.96h10.797a.96.96 0 100-1.92H10.15a.96.96 0 00-.96.96m-1.778.96a.96.96 0 110-1.92.96.96 0 010 1.92", clipRule: "evenodd" }));
}
ABI.DefaultColor = DefaultColor;
var ABI_default = ABI;
//# sourceMappingURL=ABI.js.map
