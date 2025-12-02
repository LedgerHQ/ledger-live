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
var PAYX_exports = {};
__export(PAYX_exports, {
  default: () => PAYX_default
});
module.exports = __toCommonJS(PAYX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#630";
function PAYX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.842 7.723l.938-2.297 6.421.023c.938.07 2.063.07 2.695.868.75.867.586 2.109.211 3.093a6.53 6.53 0 01-4.758 4.266c-1.546.235-3.117.164-4.687.164q.47-1.144.937-2.297c1.29 0 2.602.07 3.915-.14 1.195-.305 2.297-1.5 2.11-2.813-.118-.562-.75-.82-1.29-.82-2.156-.094-4.313 0-6.469-.048z" }), /* @__PURE__ */ React.createElement("path", { d: "M6.076 8.355h7.617l-1.007 2.602H5.044L6.076 8.38v-.023m1.219 3.188h2.648L7.18 18.574H4.576l2.742-7.031z" }));
}
PAYX.DefaultColor = DefaultColor;
var PAYX_default = PAYX;
//# sourceMappingURL=PAYX.js.map
