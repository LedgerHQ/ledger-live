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
var HMMM_exports = {};
__export(HMMM_exports, {
  default: () => HMMM_default
});
module.exports = __toCommonJS(HMMM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function HMMM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M0 0h24v24H0z" }), /* @__PURE__ */ React.createElement("path", { d: "M12.01 8.43H8.53c-.53 0-.94.4-.94.94.01 1.75 0 3.5 0 5.25v.12c.03.55.57.93 1.09.78.4-.11.64-.44.64-.88v-3.69c0-.43.32-.8.73-.86.45-.06.86.19.98.62.04.15.02.31.04.46.01.11.02.22.05.33.13.39.46.58.91.58.4 0 .75-.29.83-.68.03-.14.02-.29.02-.44 0-.25.1-.47.29-.64.28-.24.6-.3.94-.15s.52.43.52.81v3.68c0 .2.05.37.16.53.22.32.62.45.99.33s.61-.45.61-.86V9.34c0-.54-.37-.91-.91-.91h-3.49zm.9 6.16v-.14c0-.46-.34-.84-.79-.88-.52-.05-.93.24-1.01.72-.02.12-.02.25-.02.38 0 .35.15.62.45.79.31.17.64.17.95-.02.32-.19.44-.49.42-.84z" }));
}
HMMM.DefaultColor = DefaultColor;
var HMMM_default = HMMM;
//# sourceMappingURL=HMMM.js.map
