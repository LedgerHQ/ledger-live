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
var PFIL_exports = {};
__export(PFIL_exports, {
  default: () => PFIL_default
});
module.exports = __toCommonJS(PFIL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function PFIL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 100 100", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M54.006 47.572L54.5 44.5l.239-1.267 11.954 2.22a2.2 2.2 0 00.803-4.327l-11.758-2.183a254 254 0 001.742-6.118c.799-2.899 1.589-5.764 2.52-8.558.75-1.75 2-3.5 3.25-4.75 1.75-1.75 4-1.5 5.5.5.375.375.688.75 1 1.125s.625.75 1 1.125c1 1 2.25 1.25 3.25.5.75-.75.75-2 .75-3 0-.5-.5-1-.75-1.25-1.5-1.75-3.75-2.5-6-2.5-5.25-.25-8.75 2.25-11.75 6.25s-4.25 8.5-5.5 13c-.291.728-.498 1.457-.718 2.234l-.103.364-5.356-.995a2.2 2.2 0 00-.803 4.327l5.055.938-.325 1.382-.657 2.91-13.27-2.463a2.2 2.2 0 10-.803 4.326l13.103 2.433-.123.544-.993 3.724-12.79-2.375a2.2 2.2 0 10-.804 4.326l12.868 2.39c-.864 3.834-1.812 7.602-2.779 11.44l-.752 2.995c-.75 2.75-2 5.5-4.25 7.5-2 1.5-4 1.25-5.5-.75-.5-1-1.25-2-2-2.75-.75-.25-2-.5-2.5-.25-.75.5-1.25 1.75-1.25 2.75 0 .75.75 1.75 1.5 2.25 2.25 1.75 5.25 2 8 1.5 4.75-.75 8.25-3.75 10.25-8 1.5-3.25 2.75-6.75 4-10.25.686-1.646 1.146-3.442 1.587-5.265l3.972.738a2.2 2.2 0 10.804-4.326l-3.678-.683.065-.214.75-3.75.056-.35 11.782 2.188a2.2 2.2 0 00.803-4.326zm-17.04-12.17a2.2 2.2 0 10-.803 4.326 2.2 2.2 0 00.803-4.326m26.197 27.326a2.2 2.2 0 10.803-4.326 2.2 2.2 0 00-.803 4.326", clipRule: "evenodd" }));
}
PFIL.DefaultColor = DefaultColor;
var PFIL_default = PFIL;
//# sourceMappingURL=PFIL.js.map
