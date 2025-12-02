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
var JVT_exports = {};
__export(JVT_exports, {
  default: () => JVT_default
});
module.exports = __toCommonJS(JVT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function JVT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M3.292 12c0-4.941 3.95-8.96 8.836-8.96 4.888 0 8.837 4.019 8.837 8.96s-3.95 8.96-8.837 8.96S3.292 16.942 3.292 12m8.836-7.96c-4.32 0-7.836 3.557-7.836 7.96s3.515 7.96 7.836 7.96c4.322 0 7.837-3.557 7.837-7.96s-3.515-7.96-7.837-7.96", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M12.564 7.39h-.788a.285.285 0 00-.285.285v8.624c0 .157.128.284.285.284h.788a.285.285 0 00.285-.284V7.675a.285.285 0 00-.285-.285" }));
}
JVT.DefaultColor = DefaultColor;
var JVT_default = JVT;
//# sourceMappingURL=JVT.js.map
