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
var NXS_exports = {};
__export(NXS_exports, {
  default: () => NXS_default
});
module.exports = __toCommonJS(NXS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4099cd";
function NXS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M.771 15.353c.454-1.323 1.328-2.756 2.546-4.17a1.5 1.5 0 012.091-2.108 26 26 0 013.078-2.331c5.2-3.378 10.697-4.455 13.377-2.849a11.9 11.9 0 011.366 4.677c-.866 2.834-3.724 6.219-7.798 8.865-2.81 1.825-5.708 2.979-8.2 3.4a12.04 12.04 0 01-6.46-5.484m2.812-3.896c-1.758 2.03-2.462 4.12-1.61 5.433 1.287 1.982 5.64 1.44 9.721-1.21s6.347-6.407 5.06-8.389-5.64-1.44-9.722 1.21q-.68.442-1.288.918a1.5 1.5 0 01-2.16 2.037", clipRule: "evenodd" }));
}
NXS.DefaultColor = DefaultColor;
var NXS_default = NXS;
//# sourceMappingURL=NXS.js.map
