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
var NEXO_exports = {};
__export(NEXO_exports, {
  default: () => NEXO_default
});
module.exports = __toCommonJS(NEXO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1a4199";
function NEXO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.047 4.987l8.05 4.643v4.74L3.79 7.263l3.95-2.276a.32.32 0 01.314 0", opacity: 0.7 }), /* @__PURE__ */ React.createElement("path", { d: "M16.096 4.893l-4.1 2.37 4.1 2.367z", opacity: 0.9 }), /* @__PURE__ */ React.createElement("path", { d: "M16.096 4.893l3.948 2.277a.31.31 0 01.165.276v9.291l-4.113-2.367z" }), /* @__PURE__ */ React.createElement("path", { d: "M20.201 16.737l-3.948 2.275a.33.33 0 01-.315 0L7.89 14.37V9.624z", opacity: 0.9 }), /* @__PURE__ */ React.createElement("path", { d: "M3.79 7.263v9.29a.32.32 0 00.165.277l3.95 2.277V9.624z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M7.897 19.106l4.1-2.369-4.1-2.367z", opacity: 0.7 }));
}
NEXO.DefaultColor = DefaultColor;
var NEXO_default = NEXO;
//# sourceMappingURL=NEXO.js.map
