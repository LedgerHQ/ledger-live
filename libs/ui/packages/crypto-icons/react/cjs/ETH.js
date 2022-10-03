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
  default: () => ETH_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0EBDCD";
function ETH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    opacity: 0.6,
    d: "M11.998 3.002v6.652l5.623 2.513L12 3.002z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.998 3.002l-5.623 9.165 5.623-2.513V3.002z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.6,
    d: "M11.998 16.478v4.52l5.627-7.784-5.627 3.264z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.998 20.998v-4.52l-5.623-3.264 5.623 7.784z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.2,
    d: "M11.998 15.432l5.623-3.265L12 9.656v5.776z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.6,
    d: "M6.375 12.167l5.623 3.265V9.656l-5.623 2.51z"
  }));
}
ETH.DefaultColor = DefaultColor;
var ETH_default = ETH;
//# sourceMappingURL=ETH.js.map
