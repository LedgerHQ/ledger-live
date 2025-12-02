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
var AE_exports = {};
__export(AE_exports, {
  default: () => AE_default
});
module.exports = __toCommonJS(AE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#de3f6b";
function AE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.314 8.25h.678c1.06.1 2.04.616 2.765 1.358 1.507 1.529 2.335 3.686 4.253 4.824 1.386.823 3.324.15 4.005-1.24q.522-.008 1.042-.005c-.477 1.413-1.866 2.427-3.386 2.563h-.56c-.935-.075-1.844-.423-2.552-1.024-1.027-.843-1.687-1.999-2.486-3.028-.687-.91-1.388-1.932-2.524-2.346-1.405-.509-3.12.288-3.633 1.64-.45 1.115-.084 2.497.923 3.21.754.565 1.805.775 2.711.447 1.006-.351 1.753-1.149 2.326-1.995q.338.47.664.95c-.891 1.085-2.127 2.017-3.597 2.146H7.34c-1.852-.124-3.462-1.647-3.59-3.445v-.59C3.87 9.922 5.46 8.38 7.314 8.25m8.76 0h.563c1.87.118 3.46 1.671 3.613 3.47v.922c-1.543.014-3.087.005-4.63.006q.003-.404 0-.808c1.22-.003 2.438.005 3.655-.003-.086-.477-.198-.965-.49-1.37-.713-1.052-2.22-1.483-3.424-1.027-.96.345-1.683 1.1-2.24 1.905q-.324-.447-.634-.904c.88-1.101 2.107-2.054 3.587-2.191" }));
}
AE.DefaultColor = DefaultColor;
var AE_default = AE;
//# sourceMappingURL=AE.js.map
