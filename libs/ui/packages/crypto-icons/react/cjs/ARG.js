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
var ARG_exports = {};
__export(ARG_exports, {
  default: () => ARG_default
});
module.exports = __toCommonJS(ARG_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#a71435";
function ARG({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.028 3.967a8.952 8.952 0 0110.736 13.89c-.446-.972-.788-1.991-1.17-2.995l-2.31-6.052c-.224-.614-.598-1.203-1.179-1.522a4.56 4.56 0 00-2.62-.407c-.717.08-1.466.327-1.952.893-.462.533-.669 1.219-.932 1.864l-1.665 4.22c-.557 1.339-1.027 2.725-1.632 4.055a8.3 8.3 0 01-1.872-3.306A8.96 8.96 0 018.036 3.96z" }), /* @__PURE__ */ React.createElement("path", { d: "M11.357 10.068c.159-.478.797-.638 1.21-.367.223.168.303.454.407.71 1.035 2.707 2.055 5.43 3.082 8.147.136.39.334.765.415 1.17a1 1 0 01-.224.176 8.98 8.98 0 01-7.375.494c-.446-.184-.907-.343-1.298-.622.04-.366.223-.693.358-1.027 1.147-2.89 2.27-5.79 3.425-8.681" }));
}
ARG.DefaultColor = DefaultColor;
var ARG_default = ARG;
//# sourceMappingURL=ARG.js.map
