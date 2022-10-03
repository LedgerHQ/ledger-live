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
  default: () => NEXO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1A4199";
function NEXO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    opacity: 0.7,
    d: "M8.047 4.987l8.05 4.643v4.74L3.79 7.263l3.95-2.276a.315.315 0 01.314 0"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.9,
    d: "M16.096 4.893l-4.1 2.37 4.1 2.367V4.893z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16.096 4.893l3.948 2.277a.314.314 0 01.165.276v9.291l-4.113-2.367V4.893z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.9,
    d: "M20.201 16.737l-3.948 2.275a.33.33 0 01-.315 0L7.89 14.37V9.624l12.312 7.113z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.6,
    d: "M3.79 7.263v9.29a.315.315 0 00.165.277l3.95 2.277V9.624L3.79 7.264z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.7,
    d: "M7.897 19.106l4.1-2.369-4.1-2.367v4.736z"
  }));
}
NEXO.DefaultColor = DefaultColor;
var NEXO_default = NEXO;
//# sourceMappingURL=NEXO.js.map
