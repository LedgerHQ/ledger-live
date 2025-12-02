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
var IOST_exports = {};
__export(IOST_exports, {
  default: () => IOST_default
});
module.exports = __toCommonJS(IOST_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1c1c1c";
function IOST({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.375 8.25v7.5L12 19.5l-6.375-3.75v-7.5L12 4.5zm-6.576 4.055l-.592.35 1.106.647.59-.347 1.573.926-2.348 1.38-4.871-2.84-.02 1.383 4.894 2.842 4.703-2.765-2.756-1.622.555-.327-1.107-.647-.551.326-.772-.455.675-.4-1.107-.647-.673.398-1.315-.774 2.348-1.381 3.246 1.897 1.189-.704-4.438-2.578-4.702 2.766 2.496 1.469-.47.277 1.107.648.467-.276z" }));
}
IOST.DefaultColor = DefaultColor;
var IOST_default = IOST;
//# sourceMappingURL=IOST.js.map
