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
var PINK_exports = {};
__export(PINK_exports, {
  default: () => PINK_default
});
module.exports = __toCommonJS(PINK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ed79aa";
function PINK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M18.357 6.697l-1.402 1.412a5.43 5.43 0 00-3.864-1.612c-2.937 0-5.333 2.333-5.459 5.258h-.006v5.341A7.5 7.5 0 015.643 12c0-4.142 3.335-7.5 7.448-7.5a7.4 7.4 0 015.266 2.197m0 10.606a7.4 7.4 0 01-5.145 2.197v-1.998a5.43 5.43 0 003.742-1.61z", clipRule: "evenodd", opacity: 0.5 }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.529 18.588v-6.833h.005c.105-1.953 1.711-3.505 3.678-3.505 2.034 0 3.683 1.66 3.683 3.71 0 2.048-1.65 3.708-3.682 3.708a3.65 3.65 0 01-1.863-.507v4.133a7.4 7.4 0 01-1.821-.705zm3.683-4.754a1.87 1.87 0 001.862-1.874 1.87 1.87 0 00-1.862-1.876 1.87 1.87 0 00-1.862 1.876c0 1.034.834 1.874 1.862 1.874", clipRule: "evenodd" }));
}
PINK.DefaultColor = DefaultColor;
var PINK_default = PINK;
//# sourceMappingURL=PINK.js.map
