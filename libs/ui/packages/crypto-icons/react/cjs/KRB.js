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
var KRB_exports = {};
__export(KRB_exports, {
  default: () => KRB_default
});
module.exports = __toCommonJS(KRB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00aeef";
function KRB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.07 11.03q.267-.047.474-.2.207-.152.39-.505l2.72-5.24a1.5 1.5 0 01.386-.425.9.9 0 01.526-.16h1.724l-3.386 6.164q-.225.38-.51.62-.287.237-.638.361.544.14.915.46.368.316.695.889l3.259 6.506h-1.898q-.574 0-.924-.615l-2.671-5.513q-.207-.368-.45-.527a1.26 1.26 0 00-.611-.183v2.798H9.579v-2.81H8.482v6.85H6.376v-15h2.108v6.554H9.58V7.812h1.492z" }));
}
KRB.DefaultColor = DefaultColor;
var KRB_default = KRB;
//# sourceMappingURL=KRB.js.map
