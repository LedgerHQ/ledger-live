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
var DOGE_exports = {};
__export(DOGE_exports, {
  default: () => DOGE_default
});
module.exports = __toCommonJS(DOGE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#c3a634";
function DOGE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.56 10.958h3.236v1.714H9.561v3.613h2.04q1.213 0 1.984-.327t1.21-.908a3.3 3.3 0 00.598-1.361A8.6 8.6 0 0015.55 12a8.6 8.6 0 00-.157-1.689 3.3 3.3 0 00-.597-1.361q-.44-.58-1.211-.908-.773-.328-1.983-.327H9.56zm-2.074 1.714H6.375v-1.714h1.111V6h4.912q1.361 0 2.357.47a4.4 4.4 0 011.626 1.287q.63.814.937 1.907T17.625 12a8.6 8.6 0 01-.308 2.336 5.5 5.5 0 01-.937 1.908q-.63.814-1.625 1.286-.996.47-2.357.47H7.486z", clipRule: "evenodd" }));
}
DOGE.DefaultColor = DefaultColor;
var DOGE_default = DOGE;
//# sourceMappingURL=DOGE.js.map
