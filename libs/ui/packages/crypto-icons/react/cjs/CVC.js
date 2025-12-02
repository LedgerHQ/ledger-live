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
var CVC_exports = {};
__export(CVC_exports, {
  default: () => CVC_default
});
module.exports = __toCommonJS(CVC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3ab03e";
function CVC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.872 12.584a1.76 1.76 0 00.997-1.58c0-.97-.796-1.757-1.777-1.757-.983 0-1.78.787-1.78 1.757a1.76 1.76 0 001 1.58v2.17h1.56zm-.78 5.041c-3.14 0-5.693-2.523-5.693-5.625s2.553-5.625 5.693-5.625a5.69 5.69 0 015.445 3.984h1.962C18.74 7.007 15.713 4.5 12.09 4.5 7.898 4.5 4.5 7.858 4.5 12s3.398 7.5 7.59 7.5c3.622 0 6.65-2.506 7.408-5.859h-1.963a5.69 5.69 0 01-5.445 3.984" }));
}
CVC.DefaultColor = DefaultColor;
var CVC_default = CVC;
//# sourceMappingURL=CVC.js.map
