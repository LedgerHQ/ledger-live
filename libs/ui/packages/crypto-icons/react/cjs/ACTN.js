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
var ACTN_exports = {};
__export(ACTN_exports, {
  default: () => ACTN_default
});
module.exports = __toCommonJS(ACTN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "red";
function ACTN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M3.305 17.963l4.002-7.288c.166-.304.441-.386.72-.222h.03a.527.527 0 00.744-.218l2.812-4.309a2.2 2.2 0 01.36-.496c.126.154.22.332.275.523l1.215 3.01c.276.692.938 1.188 1.63 1.188h.219a1.4 1.4 0 01.94.414l.882.938q.392.416.72.884l2.844 4.086q.16.243.302.497v.027a2.5 2.5 0 01-.414-.407l-3.838-3.982a3.8 3.8 0 01-.608-.8c-.306-.663-.692-.94-1.298-.911h-.772c-.468 0-.58-.083-.72-.553l-1.102-3.45c-.192-.692-.221-.692-.414 0l-.745 2.34c-.165.467-.222 1.241-.138 1.241.028 0 .221-.36.525-.994q.086-.194.22-.36.105.398.112.809a5 5 0 01-.277.553l-.027.082c-.332.607-.332.636.027 1.215l.33.552q.19.255.305.551a4 4 0 01-.498.36l-1.711 1.104a2.25 2.25 0 01-.994.276c-.608-.027-1.132.277-1.602.91l-.662.94a5.5 5.5 0 01-.801.801l-.607.496a6 6 0 01-.993.553l-.331.083c-.24.087-.492.142-.746.164-.113 0-.221 0-.221-.027q.13-.302.305-.58" }));
}
ACTN.DefaultColor = DefaultColor;
var ACTN_default = ACTN;
//# sourceMappingURL=ACTN.js.map
