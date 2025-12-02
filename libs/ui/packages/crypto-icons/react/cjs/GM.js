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
var GM_exports = {};
__export(GM_exports, {
  default: () => GM_default
});
module.exports = __toCommonJS(GM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0060b9";
function GM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M21.996 24c-6.734-.007-13.469.014-20.202-.01C.579 23.906-.164 22.662 0 21.526.007 14.95-.014 8.371.01 1.794.094.579 1.338-.164 2.473 0 9.051.007 15.63-.014 22.205.01 23.42.096 24.165 1.338 24 2.474c-.008 6.577.015 13.155-.011 19.732-.087.994-.994 1.814-1.993 1.794" }), /* @__PURE__ */ React.createElement("path", { d: "M17.782 10.948c-1.677-1.65-3.303-3.359-5.012-4.973-.75-.526-1.675-.086-2.17.567q-3.194 3.2-6.392 6.399l5.308 5.309 2.473-2.473 2.472 2.473 5.308-5.31zm-6.692 1.708L9.5 14.247l-1.307-1.306 3.801-3.802 3.801 3.802-1.328 1.328c-.681-.622-1.251-1.389-2.028-1.89a1.24 1.24 0 00-1.349.277" }));
}
GM.DefaultColor = DefaultColor;
var GM_default = GM;
//# sourceMappingURL=GM.js.map
