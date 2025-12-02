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
var CDN_exports = {};
__export(CDN_exports, {
  default: () => CDN_default
});
module.exports = __toCommonJS(CDN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f70808";
function CDN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 4.5l-1.245 2.262c-.14.246-.393.224-.647.086l-.9-.455.67 3.475c.142.635-.31.635-.534.36L7.77 8.512l-.255.872c-.03.115-.159.235-.353.206l-1.987-.408.52 1.851c.113.412.2.582-.112.69l-.708.326 3.422 2.709a.43.43 0 01.156.454l-.3.958c1.179-.133 2.235-.332 3.414-.455.104-.01.278.157.277.275l-.155 3.51h.573l-.09-3.502c0-.118.158-.293.261-.282 1.18.123 2.235.322 3.413.454l-.299-.959a.43.43 0 01.156-.453l3.422-2.71-.708-.324c-.312-.109-.225-.279-.113-.69l.522-1.852-1.988.408c-.194.029-.324-.091-.353-.206l-.255-.872-1.573 1.717c-.224.274-.677.274-.535-.36l.671-3.476-.9.455c-.254.138-.507.16-.648-.086z" }));
}
CDN.DefaultColor = DefaultColor;
var CDN_default = CDN;
//# sourceMappingURL=CDN.js.map
