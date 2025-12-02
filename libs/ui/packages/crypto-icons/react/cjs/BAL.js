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
var BAL_exports = {};
__export(BAL_exports, {
  default: () => BAL_default
});
module.exports = __toCommonJS(BAL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function BAL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.069 17.397c-4.18 0-7.569-1.207-7.569-2.826 0-.844.923-1.605 2.4-2.142 1.153.74 3.088 1.12 5.281 1.12 2.143 0 4.036-.463 5.198-1.172 1.394.53 2.26 1.27 2.26 2.087 0 1.62-3.389 2.933-7.57 2.933" }), /* @__PURE__ */ React.createElement("path", { d: "M12.114 13.185c-3.17 0-5.739-.994-5.739-2.22 0-.68.792-1.288 2.034-1.694.886.462 2.215.758 3.705.758s2.818-.296 3.705-.758c1.244.408 2.034 1.015 2.034 1.694.002 1.226-2.568 2.22-5.739 2.22" }), /* @__PURE__ */ React.createElement("path", { d: "M12.093 9.66c-2.45 0-4.437-.82-4.437-1.83C7.656 6.821 9.644 6 12.093 6s4.437.821 4.437 1.83-1.988 1.83-4.437 1.83" }), /* @__PURE__ */ React.createElement("path", { d: "M12 17.699c-4.18 0-7.57-1.208-7.57-2.827 0-.844.923-1.604 2.4-2.142 1.154.74 3.088 1.12 5.282 1.12 2.142 0 4.035-.463 5.198-1.171 1.394.53 2.26 1.27 2.26 2.086 0 1.621-3.39 2.933-7.57 2.933" }), /* @__PURE__ */ React.createElement("path", { d: "M12.045 13.487c-3.17 0-5.74-.994-5.74-2.22 0-.68.793-1.289 2.035-1.695.886.463 2.214.759 3.705.759 1.49 0 2.818-.296 3.705-.758 1.244.407 2.034 1.014 2.034 1.694.002 1.226-2.568 2.22-5.74 2.22" }), /* @__PURE__ */ React.createElement("path", { d: "M12.024 9.962c-2.45 0-4.437-.821-4.437-1.83s1.987-1.83 4.437-1.83 4.437.82 4.437 1.83c0 1.009-1.988 1.83-4.437 1.83" }));
}
BAL.DefaultColor = DefaultColor;
var BAL_default = BAL;
//# sourceMappingURL=BAL.js.map
