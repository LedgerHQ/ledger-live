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
var NDZ_exports = {};
__export(NDZ_exports, {
  default: () => NDZ_default
});
module.exports = __toCommonJS(NDZ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#622fba";
function NDZ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M13.94 13.032q-.099.03-.19.073l-2.757-2.865a1.433 1.433 0 00-.855-2.096V6.14L9.4 5.727l1.704-.986a1.79 1.79 0 011.792 0l3.389 1.962-1.34.774a1.433 1.433 0 10-1.005 2.679zm.853 0v-2.877a1.43 1.43 0 00.819-2.08l1.522-.88.728.42a1.78 1.78 0 01.888 1.54v5.69a1.78 1.78 0 01-.889 1.54l-3.067 1.775v-2.394a1.432 1.432 0 00-.001-2.734m-1.67.652a1.433 1.433 0 00.817 2.082v2.889l-1.044.604a1.79 1.79 0 01-1.792 0l-3.649-2.112 1.371-1.07a1.43 1.43 0 001.472.226 1.433 1.433 0 00-.161-2.703v-2.698q.118-.033.228-.085zm-3.839-.06a1.433 1.433 0 00-.92 1.731l-1.703 1.332-.522-.302a1.78 1.78 0 01-.889-1.54v-5.69c0-.634.338-1.22.889-1.54l2.404-1.392.742.415v1.53a1.432 1.432 0 000 2.71zm.466-3.482a.62.62 0 11-.045-1.238.62.62 0 01.045 1.238m0 5.456a.621.621 0 11-.045-1.241.621.621 0 01.045 1.241m4.616-6.19a.62.62 0 11-.044-1.241.62.62 0 01.044 1.24m0 5.61a.62.62 0 11-.001-1.24.62.62 0 01.001 1.24", clipRule: "evenodd" }));
}
NDZ.DefaultColor = DefaultColor;
var NDZ_default = NDZ;
//# sourceMappingURL=NDZ.js.map
