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
var CURRENCY_MONAD_exports = {};
__export(CURRENCY_MONAD_exports, {
  default: () => CURRENCY_MONAD_default
});
module.exports = __toCommonJS(CURRENCY_MONAD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#6E54FF";
function CURRENCY_MONAD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 148 150", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M74 0C52.63 0 0 53.34 0 75c0 21.659 52.63 75 74 75 21.369 0 74-53.342 74-75C148 53.34 95.37 0 74 0zM62.468 117.887c-9.011-2.489-33.239-45.442-30.783-54.575 2.456-9.133 44.835-33.688 53.847-31.199 9.011 2.489 33.239 45.441 30.783 54.575-2.456 9.133-44.836 33.688-53.847 31.199z" }));
}
CURRENCY_MONAD.DefaultColor = DefaultColor;
var CURRENCY_MONAD_default = CURRENCY_MONAD;
//# sourceMappingURL=CURRENCY_MONAD.js.map
