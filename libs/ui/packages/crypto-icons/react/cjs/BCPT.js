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
var BCPT_exports = {};
__export(BCPT_exports, {
  default: () => BCPT_default
});
module.exports = __toCommonJS(BCPT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#404040";
function BCPT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5m0-.826a7.424 7.424 0 10-.001-14.848A7.424 7.424 0 0012 19.424M16.532 9.09c.124 2.204-1.912 2.786-1.912 2.786 2.327.332 2.203 2.328 2.203 2.328 0 3.241-3.617 3.368-3.617 3.368H8.134V6.429h4.573c3.825.167 3.825 2.661 3.825 2.661m-5.78-.665v2.701h1.83s1.29-.041 1.372-1.08V9.38s0-.872-1.248-.955zm3.45 6.112v-.666s0-.873-1.246-.957h-2.204v2.704h2.08s1.288-.041 1.371-1.082z" }));
}
BCPT.DefaultColor = DefaultColor;
var BCPT_default = BCPT;
//# sourceMappingURL=BCPT.js.map
