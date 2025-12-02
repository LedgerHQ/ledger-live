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
var IOP_exports = {};
__export(IOP_exports, {
  default: () => IOP_default
});
module.exports = __toCommonJS(IOP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0cafa5";
function IOP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M6.31 7.469c-.025-.015-.045-.003-.045.026v1.727a.1.1 0 00.045.078l2.183 1.262a.1.1 0 01.045.079v6.247a.1.1 0 00.046.079l1.495.862c.025.015.045.003.045-.026V9.726a.1.1 0 00-.045-.08zm11.38 0c.025-.015.046-.003.046.026v1.727a.1.1 0 01-.045.078l-2.183 1.26a.1.1 0 00-.045.08v6.247a.1.1 0 01-.046.08l-1.494.862c-.026.015-.046.003-.046-.026V9.726a.1.1 0 01.045-.08z" }), /* @__PURE__ */ React.createElement("path", { d: "M17.985 4.157c0-.029-.02-.04-.045-.026L12.045 7.54a.1.1 0 01-.09 0L6.06 4.13c-.025-.014-.045-.002-.045.027v1.726a.1.1 0 00.045.079l5.103 2.95a.1.1 0 01.045.08v10.713a.1.1 0 00.045.08l.702.404a.1.1 0 00.091 0l.701-.404a.1.1 0 00.045-.08V8.992a.1.1 0 01.046-.079l5.102-2.951a.1.1 0 00.045-.08zm-5.958 4.362q-.01-.001-.005-.01.006-.008.01 0t-.005.01" }), /* @__PURE__ */ React.createElement("path", { d: "M11.26 3.931a.066.066 0 00-.052.063V6.15a.1.1 0 00.046.079l.7.405a.1.1 0 00.092 0l.702-.405a.1.1 0 00.045-.08V3.994a.065.065 0 00-.051-.063l-.69-.126a.3.3 0 00-.103 0z" }));
}
IOP.DefaultColor = DefaultColor;
var IOP_default = IOP;
//# sourceMappingURL=IOP.js.map
