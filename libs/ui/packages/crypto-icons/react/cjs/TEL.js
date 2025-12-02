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
var TEL_exports = {};
__export(TEL_exports, {
  default: () => TEL_default
});
module.exports = __toCommonJS(TEL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#14c8ff";
function TEL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.81 8.609c.475.384.774 1.18.669 1.764l-1.02 5.643c-.107.588-.669 1.236-1.248 1.439l-5.564 1.954c-.58.203-1.44.056-1.914-.329l-4.544-3.688c-.474-.384-.774-1.176-.667-1.764l1.02-5.643c.106-.588.668-1.235 1.248-1.439l5.565-1.954c.58-.204 1.44-.056 1.915.328zm-4.733 2.533l.226-1.147-2.124.003.3-1.512h-.686a4.3 4.3 0 01-2.061 1.67l-.193.988h.929s-.315 1.42-.42 1.945c-.263 1.335.397 2.282 1.411 2.282h1.716l.3-1.268H12.04c-.638 0-.604-.349-.48-.967l.395-1.997z" }));
}
TEL.DefaultColor = DefaultColor;
var TEL_default = TEL;
//# sourceMappingURL=TEL.js.map
