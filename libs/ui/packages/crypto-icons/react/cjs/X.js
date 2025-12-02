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
var X_exports = {};
__export(X_exports, {
  default: () => X_default
});
module.exports = __toCommonJS(X_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3b5998";
function X({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M10.59 4.717H12V9.13l-1.41-1.473z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M4.51 6.204h3.713c1.257 1.317 2.52 2.63 3.778 3.95q1.092-1.137 2.18-2.278.803-.835 1.605-1.672h3.702q-2.59 2.622-5.182 5.242-.274.273-.542.55.068.07.13.142l5.078 5.135.518.522h-2.873c-.074 0-.148.004-.22-.005-.206-.006-.411.003-.616-.005-.371-.383-.738-.772-1.11-1.156l-2.185-2.283c-.162-.168-.32-.34-.486-.504-.353.375-.714.744-1.07 1.12l-2.007 2.095q-.35.368-.7.728c-.203.006-.407 0-.61.003-.117.014-.235.005-.351.008H4.51l5.451-5.513q.141-.141.278-.286z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.003 14.858c.47.497.945.99 1.416 1.485.003.98 0 1.959 0 2.94H12q0-2.213.003-4.425", clipRule: "evenodd" }));
}
X.DefaultColor = DefaultColor;
var X_default = X;
//# sourceMappingURL=X.js.map
