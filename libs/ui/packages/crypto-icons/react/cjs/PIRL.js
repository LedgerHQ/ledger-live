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
var PIRL_exports = {};
__export(PIRL_exports, {
  default: () => PIRL_default
});
module.exports = __toCommonJS(PIRL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#96b73d";
function PIRL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.695 12.079q.098.291.283.538l-1.87-1.888a1.05 1.05 0 010-1.478l2.359-2.36a2 2 0 00.14-.115l.068-.06 1.91-1.912a1.03 1.03 0 011.465.002l6.258 6.302a1.056 1.056 0 01-.755 1.66 1.07 1.07 0 01-.694-.163l-5.527-5.58-.006-.007-.018-.02L9.35 9.956l-.045.038L9.3 10l2.922 2.945a1.05 1.05 0 01-.465 1.749 1.03 1.03 0 01-1.002-.27l-1.497-1.508q-.032-.03-.07-.072l-.07-.07a2 2 0 01-.14-.177l.034.04-.023-.03a1.9 1.9 0 01-.294-.528m6.11 1.93l-2.926-2.947a1.05 1.05 0 01.337-1.703 1.03 1.03 0 011.13.228l1.498 1.508c.02.018.042.045.07.071l.068.069q.06.065.108.137l.017.02-.065-.089L17 13.273a1.05 1.05 0 010 1.48l-2.36 2.36q-.074.054-.143.114l-1.968 1.968a1.033 1.033 0 01-1.465 0l-6.358-6.41a1.056 1.056 0 01.139-1.408 1.04 1.04 0 011.404.008l5.538 5.591.018.023 2.952-2.95.043-.036z" }));
}
PIRL.DefaultColor = DefaultColor;
var PIRL_default = PIRL;
//# sourceMappingURL=PIRL.js.map
