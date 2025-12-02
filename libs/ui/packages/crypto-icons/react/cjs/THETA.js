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
var THETA_exports = {};
__export(THETA_exports, {
  default: () => THETA_default
});
module.exports = __toCommonJS(THETA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2ab8e6";
function THETA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.22 4.5h7.56l.72.745v13.51l-.72.745H8.22l-.72-.745V5.245zm.72 13.51h6.12V5.99H8.94zm5.35-3.878h-1.565v1.697h-1.413v-1.696H9.747v-1.462h4.544zm0-4.186v1.46H9.747v-1.46h1.565V8.249h1.413v1.697z" }));
}
THETA.DefaultColor = DefaultColor;
var THETA_default = THETA;
//# sourceMappingURL=THETA.js.map
