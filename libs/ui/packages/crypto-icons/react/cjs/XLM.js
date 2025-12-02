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
var XLM_exports = {};
__export(XLM_exports, {
  default: () => XLM_default
});
module.exports = __toCommonJS(XLM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function XLM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.348 6.969l-1.8.918-8.699 4.43a5.182 5.182 0 017.663-5.193l1.031-.525.154-.08a6.33 6.33 0 00-10.028 5.605 1.15 1.15 0 01-.626 1.113l-.544.277v1.293l1.6-.816.519-.264.51-.26 9.17-4.673 1.03-.524 2.13-1.086V5.892zm2.111 1.509L7.651 14.49l-1.03.525L4.5 16.097v1.293l2.106-1.073 1.8-.918 8.708-4.437a5.182 5.182 0 01-7.671 5.198l-.064.033-1.118.57a6.33 6.33 0 0010.03-5.606 1.15 1.15 0 01.624-1.112l.544-.278z" }), /* @__PURE__ */ React.createElement("path", { d: "M17.368 7.327l-1.8.918-8.698 4.43a5.182 5.182 0 017.663-5.193l1.03-.525.154-.08A6.33 6.33 0 005.69 12.483a1.15 1.15 0 01-.625 1.113l-.544.277v1.293l1.6-.816.519-.264.51-.26 9.17-4.673 1.03-.524 2.13-1.086V6.25zm2.112 1.51l-11.809 6.01-1.03.525-2.12 1.082v1.293l2.106-1.073 1.8-.918 8.708-4.437a5.182 5.182 0 01-7.672 5.198l-.064.033-1.117.57a6.33 6.33 0 0010.029-5.606 1.15 1.15 0 01.625-1.112l.544-.278z" }));
}
XLM.DefaultColor = DefaultColor;
var XLM_default = XLM;
//# sourceMappingURL=XLM.js.map
