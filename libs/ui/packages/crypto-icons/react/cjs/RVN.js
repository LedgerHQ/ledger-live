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
var RVN_exports = {};
__export(RVN_exports, {
  default: () => RVN_default
});
module.exports = __toCommonJS(RVN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#384182";
function RVN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M7.123 20.25L9.837 7.658l1.523 9.45zM9.89 7.586l4.123 9.532-2.582-.045zm.062-.072l5.4.767-1.251 8.837zm4.245 9.468l1.217-8.62.797 1.011zM15.334 8.2l-5.27-.75 4.746-1.56zm-5.295-.83l3.23-2.24 1.54.678zm-.08-.027l.623-1.192 2.634-1.056zm.623-1.245l.297-.93 2.17-.073-2.467 1.002m.28-1.003l.7-.75 1.505.678zm.743-.794l1.05-.515 1.358 1.589zm1.2-.452l1.566.686-.28.848zm1.338 1.561l.29-.866.35 1.192zm-1.452-1.66h1.146l.568.632a.036.036 0 01-.017.058.04.04 0 01-.023-.001zm1.812.722l2.332.651a.054.054 0 010 .105l-1.982.544z", clipRule: "evenodd" }));
}
RVN.DefaultColor = DefaultColor;
var RVN_default = RVN;
//# sourceMappingURL=RVN.js.map
