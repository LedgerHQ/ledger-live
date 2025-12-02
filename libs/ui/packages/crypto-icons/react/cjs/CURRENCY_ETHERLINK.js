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
var CURRENCY_ETHERLINK_exports = {};
__export(CURRENCY_ETHERLINK_exports, {
  default: () => CURRENCY_ETHERLINK_default
});
module.exports = __toCommonJS(CURRENCY_ETHERLINK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#38ff9c";
function CURRENCY_ETHERLINK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 2.566A9.43 9.43 0 002.566 12 9.43 9.43 0 0012 21.434 9.43 9.43 0 0021.434 12 9.43 9.43 0 0012 2.566m0 17.196A7.76 7.76 0 014.238 12 7.76 7.76 0 0112 4.238 7.76 7.76 0 0119.762 12 7.76 7.76 0 0112 19.762m0 0" }), /* @__PURE__ */ React.createElement("path", { d: "M11.95 6.813c-2.856.027-5.169 2.394-5.137 5.246.007.73.167 1.425.449 2.05a.145.145 0 00.238.043l1.14-1.18a.34.34 0 00.087-.292 3.343 3.343 0 013.828-3.977c.12.02.242-.02.328-.11l1.137-1.171a.136.136 0 00-.043-.219 5.2 5.2 0 00-2.028-.39m.101 10.378c2.856-.027 5.169-2.39 5.137-5.246a5.2 5.2 0 00-.449-2.05.146.146 0 00-.238-.04l-1.14 1.18a.32.32 0 00-.087.29q.07.332.07.683a3.343 3.343 0 01-3.898 3.297.38.38 0 00-.328.105L9.98 16.586a.132.132 0 00.043.219 5.2 5.2 0 002.028.39zm-4.902-1.988l2.18-2.176a1.127 1.127 0 011.602 0 1.13 1.13 0 010 1.598l-2.18 2.18a1.134 1.134 0 01-1.602 0 1.134 1.134 0 010-1.602m5.875-5.859l2.18-2.18a1.13 1.13 0 011.598 0c.445.441.445 1.16 0 1.602l-2.176 2.18a1.134 1.134 0 01-1.602 0 1.134 1.134 0 010-1.602m0 0" }));
}
CURRENCY_ETHERLINK.DefaultColor = DefaultColor;
var CURRENCY_ETHERLINK_default = CURRENCY_ETHERLINK;
//# sourceMappingURL=CURRENCY_ETHERLINK.js.map
