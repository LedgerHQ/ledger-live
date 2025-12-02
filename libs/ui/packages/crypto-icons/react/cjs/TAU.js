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
var TAU_exports = {};
__export(TAU_exports, {
  default: () => TAU_default
});
module.exports = __toCommonJS(TAU_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#7b346e";
function TAU({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M6.07 10.259l1.583 1.582H4.5zm1.583 1.912l-1.582 1.57-1.571-1.57zm2.139-2.14l-1.582 1.57V8.45zm-1.912 1.57l-1.57-1.57L7.88 8.45zm2.14-1.809l-1.57-1.57h3.152zm0-3.482l1.582 1.582H8.45zm3.722-.228l-1.583 1.57V4.5zm-1.913 1.57l-1.57-1.57 1.57-1.582zM9.792 13.98L8.21 15.55v-3.152zm-3.482 0l1.57-1.582v3.153zm7.659-4.188l-1.57-1.57h3.152zm-1.57-1.9l1.57-1.583 1.582 1.582zm-.796 8.228l-1.583 1.57-1.57-1.57zm-1.583-1.913l1.582 1.583H8.45zm7.671-4.176l-1.582 1.57V8.45zm-3.482 0l1.57-1.582v3.153zm-3.95 7.898l1.57-1.581V19.5zm1.9-1.581l1.583 1.582-1.583 1.57zm1.81 1.342l-1.57-1.57h3.152zm0-3.482l1.583 1.582h-3.154zm2.14-1.81l1.583 1.583-1.583 1.57zm-1.9 1.583l1.57-1.583v3.153zm3.71-.24l-1.57-1.57H19.5zm0-3.482L19.5 11.84h-3.152z" }));
}
TAU.DefaultColor = DefaultColor;
var TAU_default = TAU;
//# sourceMappingURL=TAU.js.map
