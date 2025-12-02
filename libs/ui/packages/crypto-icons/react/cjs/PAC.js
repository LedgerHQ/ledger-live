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
var PAC_exports = {};
__export(PAC_exports, {
  default: () => PAC_default
});
module.exports = __toCommonJS(PAC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f5eb16";
function PAC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.998 3a9 9 0 10.004 18 9 9 0 00-.004-18M8.344 6.943a.093.093 0 01.094-.09h3.75a5.3 5.3 0 012.281.473q.205.1.399.22l-2.44 1.397h-1.274a.093.093 0 00-.09.095v.703l-2.72 1.572zm-1.01 7.9l-1.63-1.647 5.368-3.097v2.007a.093.093 0 00.095.09h.766L7.34 14.843zm8.039-1.53q-1.181.985-3.241.985h-.978a.093.093 0 00-.093.093v2.027l-1.365.785-1.274.737-.08.045v-3.359l4.224-2.43a1.55 1.55 0 00.978-.387q.145-.144.24-.326l2.697-1.561a4 4 0 01.067.75q.004 1.653-1.176 2.64m-1.448-2.277q.027-.173.028-.35a1.82 1.82 0 00-.424-1.262 1.4 1.4 0 00-.615-.393l3.75-2.164 1.644 1.646z" }));
}
PAC.DefaultColor = DefaultColor;
var PAC_default = PAC;
//# sourceMappingURL=PAC.js.map
