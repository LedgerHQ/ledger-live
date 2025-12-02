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
var POA_exports = {};
__export(POA_exports, {
  default: () => POA_default
});
module.exports = __toCommonJS(POA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function POA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M3.75 18L12 3.75 20.25 18zm5.154-7.257q1.447-.966 3.096-.968 1.65.002 3.096.968L12 5.396zm-1.463 2.528l-2.248 3.882h13.614l-2.248-3.882c-1.357 1.492-2.882 2.25-4.559 2.25s-3.203-.758-4.56-2.25M12 14.674c1.454 0 2.783-.668 4.003-2.025-1.22-1.36-2.55-2.027-4.003-2.027s-2.783.668-4.003 2.026c1.22 1.359 2.55 2.027 4.003 2.027zm0-.362c-.87 0-1.576-.732-1.576-1.634s.705-1.633 1.576-1.633c.87 0 1.576.732 1.576 1.633 0 .902-.705 1.633-1.576 1.633m0-.848c.42 0 .759-.352.759-.786a.773.773 0 00-.759-.786.773.773 0 00-.759.786c0 .435.34.787.759.787z" }), /* @__PURE__ */ React.createElement("path", { d: "M3.75 19.125L12 4.875l8.25 14.25zm5.154-7.257q1.447-.966 3.096-.968 1.65.002 3.096.968L12 6.521zm-1.463 2.528l-2.248 3.882h13.614l-2.248-3.882c-1.357 1.492-2.882 2.25-4.559 2.25s-3.203-.758-4.56-2.25M12 15.799c1.454 0 2.783-.668 4.003-2.025-1.22-1.36-2.55-2.027-4.003-2.027s-2.783.668-4.003 2.026C9.217 15.132 10.547 15.8 12 15.8zm0-.362c-.87 0-1.576-.732-1.576-1.634S11.13 12.17 12 12.17s1.576.732 1.576 1.633c0 .902-.705 1.633-1.576 1.633m0-.848c.42 0 .759-.352.759-.786a.773.773 0 00-.759-.786.773.773 0 00-.759.786c0 .435.34.787.759.787z" }));
}
POA.DefaultColor = DefaultColor;
var POA_default = POA;
//# sourceMappingURL=POA.js.map
