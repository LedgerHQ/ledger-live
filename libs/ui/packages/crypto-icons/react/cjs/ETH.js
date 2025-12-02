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
var ETH_exports = {};
__export(ETH_exports, {
  default: () => ETH_default
});
module.exports = __toCommonJS(ETH_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0ebdcd";
function ETH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.999 3.002v6.652l5.622 2.513z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M11.999 3.002l-5.624 9.165 5.624-2.513z" }), /* @__PURE__ */ React.createElement("path", { d: "M11.999 16.478v4.52l5.626-7.784z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M11.999 20.998v-4.52l-5.624-3.264z" }), /* @__PURE__ */ React.createElement("path", { d: "M11.999 15.432l5.622-3.265L12 9.656z", opacity: 0.2 }), /* @__PURE__ */ React.createElement("path", { d: "M6.375 12.167l5.624 3.265V9.656z", opacity: 0.6 }));
}
ETH.DefaultColor = DefaultColor;
var ETH_default = ETH;
//# sourceMappingURL=ETH.js.map
