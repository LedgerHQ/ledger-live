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
var MSR_exports = {};
__export(MSR_exports, {
  default: () => MSR_default
});
module.exports = __toCommonJS(MSR_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#47b95c";
function MSR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.003 4.5c-4.14 0-7.5 3.36-7.5 7.5 0 .1.01.195.015.295h3.52l1.7-2.925 2.265 3.245 2.26-3.245 1.7 2.925h3.52c.005-.1.014-.195.014-.295.006-4.14-3.354-7.5-7.494-7.5m5.17 6.89a5.21 5.21 0 00-5.17-4.595 5.217 5.217 0 00-5.17 4.595h-.91a6.116 6.116 0 016.08-5.5c3.165 0 5.77 2.415 6.08 5.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M14.198 11.05l-2.195 3.15-2.196-3.15-1.25 2.15h-3.95c.576 3.57 3.66 6.3 7.396 6.3s6.82-2.73 7.395-6.305h-3.95zm2.565 3.05h.97c-.86 2.335-3.1 4.01-5.73 4.01s-4.87-1.675-5.73-4.01h.97a5.21 5.21 0 004.76 3.105c2.124 0 3.95-1.28 4.76-3.105" }));
}
MSR.DefaultColor = DefaultColor;
var MSR_default = MSR;
//# sourceMappingURL=MSR.js.map
