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
var IFIL_exports = {};
__export(IFIL_exports, {
  default: () => IFIL_default
});
module.exports = __toCommonJS(IFIL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function IFIL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { viewBox: "0 0 100 100", height: size, width: size, fill: color }, /* @__PURE__ */ React.createElement("rect", { width: 32.48, height: 6.09, x: 45.94, y: 59.13, rx: 1.01, ry: 1.01 }), /* @__PURE__ */ React.createElement("rect", { width: 56.83, height: 6.09, x: 21.58, y: 22.6, rx: 1.01, ry: 1.01 }), /* @__PURE__ */ React.createElement("path", { d: "M27.67 35.79c0-.56-.45-1.01-1.01-1.01H22.6c-.56 0-1.01.45-1.01 1.01v40.6c0 .56.45 1.01 1.01 1.01h54.8c.56 0 1.01-.45 1.01-1.01v-4.06c0-.56-.45-1.01-1.01-1.01H28.69c-.56 0-1.01-.45-1.01-1.01V35.8z" }), /* @__PURE__ */ React.createElement("path", { d: "M33.76 35.79c0-.56.45-1.01 1.01-1.01H77.4c.56 0 1.01.45 1.01 1.01v4.06c0 .56-.45 1.01-1.01 1.01H42.89c-1.68 0-3.04 1.36-3.04 3.04s1.36 3.04 3.04 3.04H77.4c.56 0 1.01.45 1.01 1.01v4.06c0 .56-.45 1.01-1.01 1.01H41.88c-1.12 0-2.03.91-2.03 2.03v9.13c0 .56-.45 1.01-1.01 1.01h-4.06c-.56 0-1.01-.45-1.01-1.01V35.76z" }));
}
IFIL.DefaultColor = DefaultColor;
var IFIL_default = IFIL;
//# sourceMappingURL=IFIL.js.map
