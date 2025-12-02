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
var MFT_exports = {};
__export(MFT_exports, {
  default: () => MFT_default
});
module.exports = __toCommonJS(MFT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#da1157";
function MFT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.752 14.27a2.27 2.27 0 100-4.54 2.27 2.27 0 000 4.54m0-7.505a5.235 5.235 0 11-3.753 8.883A5.22 5.22 0 0013.482 12a5.22 5.22 0 00-1.483-3.648 5.22 5.22 0 013.752-1.587M8.248 14.27a2.27 2.27 0 100-4.539 2.27 2.27 0 000 4.54M12 8.352A5.22 5.22 0 0010.518 12 5.22 5.22 0 0012 15.648a5.234 5.234 0 110-7.296M10.517 12c0 1.42.566 2.706 1.483 3.648A5.22 5.22 0 0013.482 12 5.22 5.22 0 0012 8.352 5.22 5.22 0 0010.517 12" }));
}
MFT.DefaultColor = DefaultColor;
var MFT_default = MFT;
//# sourceMappingURL=MFT.js.map
