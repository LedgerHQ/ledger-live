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
var BTC_exports = {};
__export(BTC_exports, {
  default: () => BTC_default
});
module.exports = __toCommonJS(BTC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f7931a";
function BTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.622 10.534c.236-1.572-.962-2.417-2.599-2.981l.531-2.13-1.296-.323-.517 2.074a48 48 0 00-1.039-.244l.521-2.088-1.296-.323-.53 2.13q-.425-.096-.829-.196l.002-.006L8.782 6l-.345 1.385s.962.22.942.234c.525.131.62.478.604.754L9.378 10.8q.056.013.135.042l-.137-.033-.848 3.399c-.064.159-.227.398-.594.307.013.019-.942-.235-.942-.235l-.644 1.484 1.688.42.923.24-.536 2.153 1.295.323.53-2.13q.531.142 1.034.267l-.53 2.121 1.297.323.536-2.15c2.211.419 3.873.25 4.573-1.75.564-1.609-.028-2.538-1.191-3.143.847-.195 1.485-.753 1.655-1.904m-2.962 4.154c-.4 1.61-3.111.74-3.99.52l.712-2.853c.88.22 3.697.654 3.278 2.333m.4-4.177c-.364 1.465-2.62.72-3.352.538l.645-2.588c.732.182 3.089.522 2.708 2.05" }));
}
BTC.DefaultColor = DefaultColor;
var BTC_default = BTC;
//# sourceMappingURL=BTC.js.map
