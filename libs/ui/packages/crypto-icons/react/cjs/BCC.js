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
var BCC_exports = {};
__export(BCC_exports, {
  default: () => BCC_default
});
module.exports = __toCommonJS(BCC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f7931c";
function BCC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M5.513 14.232c-.006-2.26 1.585-4.155 3.86-4.582.195-.036.25-.101.245-.292a31 31 0 010-1.521c.004-.183-.054-.291-.21-.393-.547-.357-.77-1.005-.57-1.587a1.406 1.406 0 011.416-.968c.577.027 1.106.457 1.262 1.028a1.37 1.37 0 01-.57 1.519c-.18.114-.236.229-.23.433a35 35 0 01.003 1.522c-.002.147.02.225.194.248.332.044.657.133.964.265.116.05.178.02.255-.066a957 957 0 013.239-3.55c.112-.121.08-.204.028-.33a1.62 1.62 0 01.389-1.818c.454-.424 1.206-.545 1.749-.281.639.31.99.903.947 1.6-.059.934-.967 1.637-1.888 1.445-.186-.039-.294.006-.415.14a598 598 0 01-3.018 3.31c-.122.133-.14.204.013.336 1.653 1.442 2.103 3.614 1.16 5.592-.07.15-.055.236.06.345q.412.395.806.806c.105.11.204.138.36.098a1.389 1.389 0 011.344 2.307c-.415.442-1.094.57-1.621.306-.576-.288-.894-.904-.758-1.536.04-.181-.002-.285-.123-.4q-.336-.317-.65-.655c-.123-.132-.199-.134-.338-.003-1.424 1.327-3.076 1.67-4.899 1.023-1.812-.643-2.999-2.405-3.004-4.34" }));
}
BCC.DefaultColor = DefaultColor;
var BCC_default = BCC;
//# sourceMappingURL=BCC.js.map
