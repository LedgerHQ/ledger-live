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
var JUSDT_exports = {};
__export(JUSDT_exports, {
  default: () => JUSDT_default
});
module.exports = __toCommonJS(JUSDT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function JUSDT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M18.93 4.532H5.318v3.33h5.021v2.188c-4.065.183-7.124.981-7.124 1.937s3.059 1.754 7.124 1.938v7.008h3.57v-7.008c4.069-.183 7.13-.98 7.13-1.938 0-.956-3.061-1.754-7.13-1.937V7.862h5.021zm-8.59 5.728v2.444a20.3 20.3 0 003.57 0V10.26c3.597.16 6.284.796 6.284 1.556 0 .88-3.613 1.595-8.069 1.595s-8.069-.714-8.069-1.595c0-.76 2.686-1.395 6.283-1.556", clipRule: "evenodd" }));
}
JUSDT.DefaultColor = DefaultColor;
var JUSDT_default = JUSDT;
//# sourceMappingURL=JUSDT.js.map
