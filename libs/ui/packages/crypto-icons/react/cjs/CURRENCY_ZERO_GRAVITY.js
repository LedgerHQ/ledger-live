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
var CURRENCY_ZERO_GRAVITY_exports = {};
__export(CURRENCY_ZERO_GRAVITY_exports, {
  default: () => CURRENCY_ZERO_GRAVITY_default
});
module.exports = __toCommonJS(CURRENCY_ZERO_GRAVITY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#B75FFF";
function CURRENCY_ZERO_GRAVITY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 378 183", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.68 149.413C-8.813 113.47-6.759 60.351 26.832 26.797c35.786-35.73 93.795-35.73 129.581 0 35.778 35.737 35.778 93.667 0 129.404-34.697 34.65-90.297 35.696-126.256 3.156l80.901-80.8 9.718 9.704L71.38 137.6c18.454 8.081 40.768 4.572 55.873-10.512 19.683-19.656 19.683-51.522 0-71.17-19.675-19.656-51.584-19.656-71.267 0-17.463 17.44-19.427 44.503-5.89 64.11L20.68 149.413zM263.92 109.704V96.021H378c-2.318 46.965-40.191 84.589-87.303 86.583-53.926 2.29-98.258-42.69-95.14-96.502C198.329 38.214 239.378.228 286.754.228c47.376 0 86.321 36.008 90.908 82.11h-41.494c-4.29-23.356-24.782-41.051-49.414-41.051-31.026 0-55.485 28.083-49.273 60.196 3.844 19.845 19.493 35.424 39.382 39.213 25.416 4.836 48.292-9.465 56.714-30.992H263.92z" }));
}
CURRENCY_ZERO_GRAVITY.DefaultColor = DefaultColor;
var CURRENCY_ZERO_GRAVITY_default = CURRENCY_ZERO_GRAVITY;
//# sourceMappingURL=CURRENCY_ZERO_GRAVITY.js.map
