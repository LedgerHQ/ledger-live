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
var SNGLS_exports = {};
__export(SNGLS_exports, {
  default: () => SNGLS_default
});
module.exports = __toCommonJS(SNGLS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#b30d23";
function SNGLS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.699 15.562L12 16.864l-.699-1.302c-4.222-.328-7.537-3.476-7.537-3.476 0-.008 3.22-3.059 7.357-3.461l.547-.938.332-.55.563.937.316.551c4.136.394 7.357 3.46 7.357 3.46s-3.315 3.149-7.538 3.477zm-8.236-3.476c-.007 0 3.185 2.18 6.391 2.642l-1.563-2.925.425-.737.39.73-.008.007 1.52 2.992q.184.01.368.008c.122 0 .237 0 .36-.008l1.117-2.226.814-1.518.425.737-1.563 2.932c3.206-.453 6.397-2.582 6.397-2.642 0-.053-3.04-2.084-6.167-2.605l.475.827-.396.795-1.03-1.726A8 8 0 0012 9.354q-.207.002-.425.015l-1.052 1.726-.389-.759.496-.855c-3.126.528-6.167 2.605-6.167 2.605" }));
}
SNGLS.DefaultColor = DefaultColor;
var SNGLS_default = SNGLS;
//# sourceMappingURL=SNGLS.js.map
