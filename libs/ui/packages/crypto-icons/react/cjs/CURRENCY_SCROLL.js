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
var CURRENCY_SCROLL_exports = {};
__export(CURRENCY_SCROLL_exports, {
  default: () => CURRENCY_SCROLL_default
});
module.exports = __toCommonJS(CURRENCY_SCROLL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function CURRENCY_SCROLL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M5.271 9.982c-.685-.649-1.17-1.489-1.17-2.491v-.106c.057-1.704 1.46-3.074 3.16-3.129h10.85c.285.01.513.213.513.501v9.179c.25.046.37.076.611.163.187.069.455.22.455.22v-9.56a1.583 1.583 0 00-1.578-1.572H7.262a4.3 4.3 0 00-4.227 4.304c0 1.366.623 2.53 1.643 3.35.068.055.135.126.317.125.32 0 .544-.252.532-.53-.012-.23-.108-.313-.256-.454" }), /* @__PURE__ */ React.createElement("path", { d: "M17.835 14.546H9.323a1.043 1.043 0 00-1.033 1.042v1.22c.016.566.497 1.05 1.067 1.05h.632v-1.05h-.632v-1.194h.346c1.073 0 1.864 1 1.864 2.066 0 .945-.86 2.156-2.306 2.06-1.283-.086-1.971-1.225-1.971-2.06V7.307a.85.85 0 00-.85-.849h-.847v1.059h.63v10.162c-.032 2.066 1.473 3.109 3.04 3.109l8.572.024a3.13 3.13 0 003.13-3.133 3.13 3.13 0 00-3.13-3.133m2.062 3.202a2.065 2.065 0 01-2.062 1.998l-5.965-.023c.476-.55.763-1.266.763-2.044 0-1.224-.73-2.066-.73-2.066h5.932c1.14 0 2.063.925 2.063 2.066v.069M9.129 6.649h6.415a.529.529 0 010 1.057H9.13V6.648" }), /* @__PURE__ */ React.createElement("path", { d: "M9.129 11.645h6.415a.529.529 0 010 1.057H9.13zm0-2.497h7.544a.529.529 0 010 1.057H9.129V9.146z" }));
}
CURRENCY_SCROLL.DefaultColor = DefaultColor;
var CURRENCY_SCROLL_default = CURRENCY_SCROLL;
//# sourceMappingURL=CURRENCY_SCROLL.js.map
