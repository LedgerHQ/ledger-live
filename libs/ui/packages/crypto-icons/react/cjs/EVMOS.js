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
var EVMOS_exports = {};
__export(EVMOS_exports, {
  default: () => EVMOS_default
});
module.exports = __toCommonJS(EVMOS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function EVMOS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.552 5.592c-3.81 1.468-4.16 5.23-5.252 6.987-1.106 1.778-3.639 2.758-3.293 3.664.347.906 2.883-.067 4.89.511 1.982.572 4.748 3.133 8.559 1.664a6.84 6.84 0 003.993-4.113.317.317 0 00-.267-.424.31.31 0 00-.309.17 5.408 5.408 0 01-9.731-.095q-.093-.193-.172-.397a6 6 0 01-.137-.41 62 62 0 013.966-1.681 62 62 0 013.996-1.393 45 45 0 012.21-.624l.143-.036a.206.206 0 01.242.126v.002q.033.087.062.174.197.562.296 1.131a.245.245 0 00.357.177 29 29 0 001.495-.86c1.666-1.03 2.59-1.904 2.4-2.399s-1.458-.524-3.383-.17a30 30 0 00-2.405.55q-.924.247-1.939.562a64 64 0 00-3.996 1.395 65 65 0 00-3.667 1.54 5.44 5.44 0 013.478-5.116 5.38 5.38 0 013.914.013c.12.047.256.014.344-.081a.318.318 0 00-.085-.495 6.8 6.8 0 00-5.709-.372" }));
}
EVMOS.DefaultColor = DefaultColor;
var EVMOS_default = EVMOS;
//# sourceMappingURL=EVMOS.js.map
