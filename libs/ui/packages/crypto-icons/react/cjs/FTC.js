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
var FTC_exports = {};
__export(FTC_exports, {
  default: () => FTC_default
});
module.exports = __toCommonJS(FTC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#27323a";
function FTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.452 4.5s1.235 1.098.359 3.332a4.2 4.2 0 01-.686 1.13l-3.049 3.577-2.446 3.194s-2.81-.462-3.902.671l4.63.206s-.988 1.082-4.89.307c0 0 .053 1.086 1.823 1.395 0 0-1.563.517-2.5-.98 0 0 0 1.086 1.093 1.548 0 0-.885.205-1.614-.722l-1.248 1.338s-.258.051-.103-.205l1.04-1.236s.104-.877-.522-.569c0 0-.415.154-.26.62 0 0-.625-.513.105-1.184l-1.407-1.394 1.82.979-.78-1.907 1.3 1.65s-.109-1.855.466-2.369c0 0 .155 1.805.885 1.96l-.053-3.764.782-.67.103 2.368s.207.256.414-.051c0 0 .47-.774.47-3.04l1.248-1.186.156.929s.21.359.47.05l.259-1.803S14.08 6.767 18.452 4.5m-8.325 10.463c4.316-3.968 6.608-7.833 6.603-7.833-2.131 1.492-6.603 7.833-6.603 7.833" }));
}
FTC.DefaultColor = DefaultColor;
var FTC_default = FTC;
//# sourceMappingURL=FTC.js.map
