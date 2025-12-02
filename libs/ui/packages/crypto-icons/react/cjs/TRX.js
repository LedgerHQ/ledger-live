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
var TRX_exports = {};
__export(TRX_exports, {
  default: () => TRX_default
});
module.exports = __toCommonJS(TRX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ef0027";
function TRX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.449 7.435L5.625 5.443l5.696 14.334 7.938-9.67zm-.174.877l1.656 1.575-4.529.82zm-3.856 2.23L7.646 6.584l7.801 1.435zm-.34.7l-.779 6.435L7.104 7.115zm.72.342l5.015-.908-5.752 7.007z" }), /* @__PURE__ */ React.createElement("path", { d: "M16.007 6.825L5.183 4.833l5.697 14.334 7.937-9.67zm-.174.878l1.656 1.574-4.528.82zm-3.856 2.23l-4.773-3.96 7.801 1.436zm-.34.7l-.779 6.435L6.663 6.506zm.72.341l5.015-.908-5.752 7.008z" }));
}
TRX.DefaultColor = DefaultColor;
var TRX_default = TRX;
//# sourceMappingURL=TRX.js.map
