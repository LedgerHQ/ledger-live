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
var BABY_exports = {};
__export(BABY_exports, {
  default: () => BABY_default
});
module.exports = __toCommonJS(BABY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ce6533";
function BABY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 690 690", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.499 143.372a24.18 24.18 0 015.58-25.47l90.82-90.82a24.19 24.19 0 0125.46-5.59l193.65 71.14a12.09 12.09 0 017.92 11.35v42.4c0 3.21-1.27 6.28-3.54 8.55l-47.14 47.13c-3.33 3.34-8.3 4.43-12.73 2.79l-52.02-19.18-57.16-21.09c-4.83-1.79-9.55 2.92-7.76 7.76l40.27 109.18c1.63 4.43.55 9.4-2.79 12.73l-41.91 41.89c-4.72 4.72-4.72 12.38 0 17.1l42.13 42.13c3.34 3.34 4.43 8.31 2.79 12.73l-40.27 109.17c-1.79 4.84 2.92 9.55 7.76 7.76l109.18-40.28c4.43-1.63 9.4-.54 12.73 2.79l46.91 46.91c2.27 2.27 3.54 5.34 3.54 8.55v42.41c0 5.06-3.15 9.59-7.9 11.34l-193.42 71.36a24.18 24.18 0 01-25.47-5.59l-90.83-90.83a24.17 24.17 0 01-5.58-25.47l71.11-192.77c1.99-5.4 1.99-11.34 0-16.74zm667 402.88a24.18 24.18 0 01-5.58 25.47l-90.82 90.83a24.18 24.18 0 01-25.46 5.59l-193.65-71.14a12.09 12.09 0 01-7.92-11.35v-42.4c0-3.21 1.27-6.28 3.54-8.55l47.14-47.13c3.33-3.34 8.3-4.43 12.73-2.79l52.02 19.18 57.16 21.09c4.83 1.79 9.54-2.92 7.76-7.76l-40.27-109.18c-1.63-4.43-.55-9.4 2.79-12.73l41.91-41.89c4.72-4.72 4.72-12.38 0-17.1l-42.13-42.13a12.07 12.07 0 01-2.79-12.73l40.27-109.17c1.79-4.84-2.92-9.55-7.76-7.76l-109.18 40.28c-4.43 1.63-9.4.54-12.73-2.79l-46.91-46.91a12.08 12.08 0 01-3.54-8.55v-42.41c0-5.06 3.15-9.59 7.9-11.34l193.42-71.36c8.85-3.27 18.79-1.08 25.47 5.59l90.82 90.83a24.16 24.16 0 015.59 25.47l-71.11 192.77c-2 5.4-2 11.34 0 16.74l71.34 193.37z" }));
}
BABY.DefaultColor = DefaultColor;
var BABY_default = BABY;
//# sourceMappingURL=BABY.js.map
