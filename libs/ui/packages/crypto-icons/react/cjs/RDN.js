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
var RDN_exports = {};
__export(RDN_exports, {
  default: () => RDN_default
});
module.exports = __toCommonJS(RDN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2a2a2a";
function RDN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.125 4.504h6.083c.074-.022.111.045.16.083a11 11 0 011.534 1.792 11.4 11.4 0 011.479 2.96 10 10 0 01.487 3.46h-3.101a4 4 0 00.016-.467c-.032-1.104-.372-2.186-.909-3.145-.573-1.026-1.374-1.912-2.285-2.648-.991-.802-2.107-1.435-3.27-1.946-.064-.03-.132-.054-.194-.089M9.376 10q1.56 2.823 3.117 5.65.377.68.75 1.362c-1.291.827-2.578 1.66-3.868 2.488V10z" }));
}
RDN.DefaultColor = DefaultColor;
var RDN_default = RDN;
//# sourceMappingURL=RDN.js.map
