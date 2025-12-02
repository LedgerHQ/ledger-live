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
var DOT_exports = {};
__export(DOT_exports, {
  default: () => DOT_default
});
module.exports = __toCommonJS(DOT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#e6007a";
function DOT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.137 5.76c0-.973-1.383-1.76-3.087-1.76-1.706 0-3.087.787-3.087 1.76 0 .974 1.38 1.765 3.087 1.765 1.704 0 3.087-.79 3.087-1.764m0 13.275c0-.973-1.383-1.76-3.087-1.76-1.706 0-3.087.787-3.087 1.76 0 .974 1.38 1.764 3.087 1.764 1.704 0 3.087-.79 3.087-1.764M7.735 6.458c-.858-.487-2.248.293-3.1 1.742s-.846 3.019.013 3.505c.859.487 2.248-.295 3.098-1.741.853-1.45.848-3.02-.01-3.506m11.714 6.637c-.86-.487-2.246.295-3.099 1.741-.85 1.45-.847 3.02.011 3.506.861.487 2.248-.293 3.1-1.742s.846-3.019-.013-3.505m-11.7 1.741c-.853-1.449-2.242-2.228-3.101-1.741-.859.486-.864 2.056-.01 3.505.85 1.45 2.239 2.229 3.097 1.742s.864-2.056.014-3.506M19.463 8.2c-.853-1.45-2.24-2.229-3.098-1.742-.859.487-.864 2.056-.011 3.503.85 1.45 2.24 2.231 3.098 1.744.859-.486.864-2.056.01-3.505m0 0" }));
}
DOT.DefaultColor = DefaultColor;
var DOT_default = DOT;
//# sourceMappingURL=DOT.js.map
