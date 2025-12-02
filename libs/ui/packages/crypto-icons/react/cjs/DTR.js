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
var DTR_exports = {};
__export(DTR_exports, {
  default: () => DTR_default
});
module.exports = __toCommonJS(DTR_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#121747";
function DTR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M13.535 17.159c0 .858-.69 1.555-1.542 1.555a1.55 1.55 0 01-1.541-1.556V6.816c0-.859.69-1.555 1.541-1.555a1.55 1.55 0 011.542 1.556zm-5.19.003a1.55 1.55 0 01-.761 1.365 1.52 1.52 0 01-1.551 0 1.55 1.55 0 01-.76-1.365v-2.325a1.55 1.55 0 01.76-1.365 1.52 1.52 0 011.55 0 1.55 1.55 0 01.761 1.365z" }), /* @__PURE__ */ React.createElement("path", { d: "M18.728 13.056c0 .859-.69 1.556-1.542 1.556a1.55 1.55 0 01-1.542-1.557V9.131c0-.86.69-1.557 1.542-1.557s1.542.697 1.542 1.557z", opacity: 0.5 }));
}
DTR.DefaultColor = DefaultColor;
var DTR_default = DTR;
//# sourceMappingURL=DTR.js.map
