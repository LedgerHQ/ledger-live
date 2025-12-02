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
var CURRENCY_BOBA_exports = {};
__export(CURRENCY_BOBA_exports, {
  default: () => CURRENCY_BOBA_default
});
module.exports = __toCommonJS(CURRENCY_BOBA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function CURRENCY_BOBA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.127 15.372a.66.66 0 01-.652-.55L7.428 8.674l-.79-4.643a.66.66 0 111.298-.224l1.837 10.791a.66.66 0 01-.54.763c-.03.01-.07.01-.106.01" }), /* @__PURE__ */ React.createElement("path", { d: "M12.2 10.394a5.13 5.13 0 00-2.84.855l.225 1.308a3.98 3.98 0 012.621-.982 4 4 0 013.996 3.995 4 4 0 01-3.996 3.996 4 4 0 01-3.904-4.851l-.356-2.082a5.16 5.16 0 00-.916 2.937 5.18 5.18 0 005.17 5.171 5.18 5.18 0 005.172-5.17 5.18 5.18 0 00-2.863-4.633 5.1 5.1 0 00-2.308-.544" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.6, d: "M11.219 17.881a.702.702 0 111.404 0 .702.702 0 01-1.404 0m2.198-.819a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-1.73-1.512a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-2.184.717a.702.702 0 111.405 0 .702.702 0 01-1.405 0m4.367-1.44a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-1.71-1.608a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-2.209.819a.702.702 0 111.405 0 .702.702 0 01-1.405 0" }));
}
CURRENCY_BOBA.DefaultColor = DefaultColor;
var CURRENCY_BOBA_default = CURRENCY_BOBA;
//# sourceMappingURL=CURRENCY_BOBA.js.map
