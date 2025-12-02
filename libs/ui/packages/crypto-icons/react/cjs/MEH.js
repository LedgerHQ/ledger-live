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
var MEH_exports = {};
__export(MEH_exports, {
  default: () => MEH_default
});
module.exports = __toCommonJS(MEH_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function MEH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.253 14.553a.5.5 0 01.5-.5h6.751a.5.5 0 110 1H8.753a.5.5 0 01-.5-.5m0-5.115a.5.5 0 01.5-.5h1.688a.5.5 0 010 1H8.753a.5.5 0 01-.5-.5m5.063 0a.5.5 0 01.5-.5h1.688a.5.5 0 110 1h-1.688a.5.5 0 01-.5-.5", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M3.139 12a8.99 8.99 0 1117.98 0 8.99 8.99 0 01-17.98 0m8.99-7.99a7.99 7.99 0 100 15.98 7.99 7.99 0 000-15.98", clipRule: "evenodd" }));
}
MEH.DefaultColor = DefaultColor;
var MEH_default = MEH;
//# sourceMappingURL=MEH.js.map
