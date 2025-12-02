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
var KAS_exports = {};
__export(KAS_exports, {
  default: () => KAS_default
});
module.exports = __toCommonJS(KAS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#70c7ba";
function KAS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M22.3 7.5c-.6-1.4-1.5-2.6-2.5-3.7-1-1-2.3-1.8-3.7-2.4-1.3-.6-2.8-.8-4.3-.8s-3.1 0-4.4.6C6 1.8 4.9 2.8 3.8 3.9 2.8 4.9 1.6 6 1 7.4.4 8.7.6 10.3.6 11.9s.1 3 .7 4.3c.6 1.4 1.7 2.3 2.8 3.4 1 1 2 2.3 3.3 2.8 1.3.6 2.9.9 4.4.9s3-.5 4.3-1c1.4-.6 2.6-1.5 3.6-2.5s1.9-2.3 2.4-3.7c.6-1.3 1.2-2.8 1.2-4.3s-.5-3-1.1-4.4zM15 18.4l-2.4-.4.7-4.7-5 3.9-1.5-1.9 4.4-3.4-4.4-3.4 1.5-1.9 5 3.9-.7-4.7 2.4-.4 1 6.5z" }));
}
KAS.DefaultColor = DefaultColor;
var KAS_default = KAS;
//# sourceMappingURL=KAS.js.map
