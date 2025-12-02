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
var CRW_exports = {};
__export(CRW_exports, {
  default: () => CRW_default
});
module.exports = __toCommonJS(CRW_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0f1529";
function CRW({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M18.625 11.51c-.151.033-.255.053-.356.08-.633.166-1.272.297-1.932.272-.882-.034-1.64-.388-2.307-.96-.27-.232-.521-.487-.779-.733-.125-.119-.155-.254-.06-.408l.244-.396.329.362c.475.526.982 1.006 1.652 1.261.658.25 1.328.214 2 .1.951-.158 1.83-.538 2.69-.965.03-.014.06-.023.144-.056-.057.107-.088.17-.125.23q-1.885 3.172-3.772 6.34c-.155.26-.212.28-.48.148-1.775-.871-3.634-1.037-5.552-.707-.3.052-.354.026-.497-.281-.156-.336-.155-.327.2-.396.988-.193 2-.234 3.001-.122.937.105 1.87.243 2.73.684.123.064.188.01.25-.091q.817-1.366 1.639-2.73c.293-.487.592-.97.887-1.455.026-.042.046-.087.094-.177m-13.24.09q.187.32.379.636l2.523 4.185c.12.2.12.206-.088.301-.448.206-.392.26-.666-.199q-1.452-2.436-2.9-4.873l-.783-1.316c-.037-.063-.067-.13-.1-.195l.03-.04c.11.05.22.095.33.146.661.31 1.331.598 2.04.773.911.227 1.81.253 2.678-.18.54-.269.985-.666 1.386-1.118.64-.726 1.161-1.54 1.633-2.39l.115-.205c.062.093.102.164.152.225.277.34.211.64-.022.992-.52.783-1.045 1.558-1.738 2.194-.619.569-1.313.998-2.13 1.193-.64.154-1.283.123-1.926.004q-.44-.084-.88-.175z", clipRule: "evenodd" }));
}
CRW.DefaultColor = DefaultColor;
var CRW_default = CRW;
//# sourceMappingURL=CRW.js.map
