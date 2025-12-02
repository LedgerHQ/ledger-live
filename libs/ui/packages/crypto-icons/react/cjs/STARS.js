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
var STARS_exports = {};
__export(STARS_exports, {
  default: () => STARS_default
});
module.exports = __toCommonJS(STARS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#e38cd4";
function STARS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 400 400", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M200 400c-53.434 0-103.636-20.808-141.414-58.586S0 253.434 0 200 20.808 96.364 58.586 58.586 146.566 0 200 0s103.636 20.808 141.414 58.586S400 146.566 400 200s-20.808 103.636-58.586 141.414S253.434 400 200 400m0-383.737C98.687 16.263 16.263 98.687 16.263 200S98.687 383.737 200 383.737 383.737 301.313 383.737 200 301.313 16.263 200 16.263m-23.838 125.151L59.394 112.525l77.576 92.02-63.637 102.223 111.515-45.354 77.576 92.02-8.687-120 111.516-45.353-116.768-28.889-8.687-120z" }));
}
STARS.DefaultColor = DefaultColor;
var STARS_default = STARS;
//# sourceMappingURL=STARS.js.map
