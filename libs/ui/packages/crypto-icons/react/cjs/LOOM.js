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
var LOOM_exports = {};
__export(LOOM_exports, {
  default: () => LOOM_default
});
module.exports = __toCommonJS(LOOM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#48beff";
function LOOM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.646 19.68L4.358 11.057a3.186 3.186 0 010-5.215L7.335 3.75l12.29 8.62a3.184 3.184 0 010 5.215zM7.332 5.146L5.012 6.77a2.047 2.047 0 000 3.355l11.636 8.158 2.32-1.623a2.047 2.047 0 000-3.355z" }), /* @__PURE__ */ React.createElement("path", { d: "M7.322 18.282l-2.317-1.626a2.046 2.046 0 010-3.354l6-4.188-.99-.696-5.658 3.951a3.186 3.186 0 000 5.215l2.967 2.084 3.673-2.572-.985-.694zM19.627 5.846l-2.97-2.082-3.675 2.572.986.693 2.685-1.878 2.317 1.625a2.047 2.047 0 010 3.355l-6 4.186.987.694 5.665-3.957a3.183 3.183 0 000-5.215l.006.007" }), /* @__PURE__ */ React.createElement("path", { d: "M5.06 11.872L9.731 8.6l.65.93-4.672 3.272zm13.312-1.319l-2.276 1.594.65.93 2.357-1.652q-.373-.432-.736-.873z" }), /* @__PURE__ */ React.createElement("path", { d: "M16.646 19.68L4.358 11.057a3.186 3.186 0 010-5.215L7.335 3.75l12.29 8.62a3.184 3.184 0 010 5.215zM7.332 5.146L5.012 6.77a2.047 2.047 0 000 3.355l11.636 8.158 2.32-1.623a2.047 2.047 0 000-3.355z" }), /* @__PURE__ */ React.createElement("path", { d: "M7.322 18.282l-2.317-1.626a2.046 2.046 0 010-3.354l6-4.188-.99-.696-5.658 3.951a3.186 3.186 0 000 5.215l2.967 2.084 3.673-2.572-.985-.694zM19.627 5.846l-2.97-2.082-3.675 2.572.986.693 2.685-1.878 2.317 1.625a2.047 2.047 0 010 3.355l-6 4.186.987.694 5.665-3.957a3.183 3.183 0 000-5.215l.006.007" }), /* @__PURE__ */ React.createElement("path", { d: "M5.06 11.872L9.731 8.6l.65.93-4.672 3.272zm13.312-1.319l-2.276 1.594.65.93 2.357-1.652q-.373-.432-.736-.873z" }));
}
LOOM.DefaultColor = DefaultColor;
var LOOM_default = LOOM;
//# sourceMappingURL=LOOM.js.map
