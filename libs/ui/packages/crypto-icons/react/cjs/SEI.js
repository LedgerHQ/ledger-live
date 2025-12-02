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
var SEI_exports = {};
__export(SEI_exports, {
  default: () => SEI_default
});
module.exports = __toCommonJS(SEI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#89395b";
function SEI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 19 19", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.477 19a9.52 9.52 0 007.101-3.168 2.264 2.264 0 00-2.898-.05l-.164.132a3.823 3.823 0 01-5.239-.43 2.037 2.037 0 00-2.843-.187L3.53 16.922A9.5 9.5 0 009.477 19m3.085-4.602a4.05 4.05 0 015.075.004A9.46 9.46 0 0019 9.5a9.4 9.4 0 00-1.668-5.371 2.26 2.26 0 00-1.969.52l-.156.14a3.82 3.82 0 01-5.254-.187 2.043 2.043 0 00-2.851-.059L4.89 6.621 3.67 5.328l2.216-2.074a3.815 3.815 0 015.336.11 2.04 2.04 0 002.804.097l.157-.14a4.06 4.06 0 011.66-.884A9.5 9.5 0 009.477 0C4.64 0 .648 3.594.035 8.25a3.91 3.91 0 014.477.79 2.124 2.124 0 002.824.19l1.238-.964a4.124 4.124 0 015.242.136l2.41 2.098-1.167 1.336-2.41-2.094a2.345 2.345 0 00-2.981-.082l-1.238.965a3.906 3.906 0 01-5.192-.348 2.124 2.124 0 00-2.968-.062l-.27.25a9.4 9.4 0 002.246 5.219l2.031-1.735a3.816 3.816 0 015.325.356 2.04 2.04 0 002.796.226zm0 0" }));
}
SEI.DefaultColor = DefaultColor;
var SEI_default = SEI;
//# sourceMappingURL=SEI.js.map
