var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => KCS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0093DD";
function KCS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M9.78 12l3.88 3.997 2.449-2.522a1.084 1.084 0 011.566 0 1.165 1.165 0 010 1.614l-3.232 3.33a1.092 1.092 0 01-1.566 0l-4.662-4.805v2.856c0 .627-.5 1.142-1.108 1.142C6.495 17.612 6 17.1 6 16.47V7.53c0-.63.495-1.142 1.107-1.142S8.215 6.9 8.215 7.53v2.856l4.662-4.805a1.092 1.092 0 011.566 0l3.233 3.33a1.165 1.165 0 010 1.614 1.085 1.085 0 01-1.568 0L13.66 8.002 9.78 12zm3.882-1.143c.612 0 1.108.512 1.108 1.143 0 .63-.496 1.142-1.108 1.142-.612 0-1.109-.512-1.109-1.142 0-.631.497-1.143 1.109-1.143z"
  }));
}
KCS.DefaultColor = DefaultColor;
var KCS_default = KCS;
//# sourceMappingURL=KCS.js.map
