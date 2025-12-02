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
var CRO_exports = {};
__export(CRO_exports, {
  default: () => CRO_default
});
module.exports = __toCommonJS(CRO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#002d74";
function CRO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 2L3.5 7.011v9.978L12 22l8.5-5.011V7.01zm5.99 13.512L12 19.002l-5.99-3.49V8.488L12 4.953l5.99 3.535z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 4.953V2L3.5 7.011v9.978L12 22v-2.998l-5.99-3.49V8.488zm0 14.049v2.953l8.5-5.01V7.01L12 2v2.953l5.99 3.49v7.025z" }), /* @__PURE__ */ React.createElement("path", { d: "M16.008 14.304L12 16.63l-3.963-2.327V9.65L12 7.324l4.008 2.327z" }));
}
CRO.DefaultColor = DefaultColor;
var CRO_default = CRO;
//# sourceMappingURL=CRO.js.map
