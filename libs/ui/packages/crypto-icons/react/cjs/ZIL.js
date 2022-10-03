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
  default: () => ZIL_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#49C1BF";
function ZIL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M6.765 5.477l8.336 4.037 2.134-.961-8.301-4.037-2.169.96z",
    fillOpacity: 0.2
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15.1 9.504l2.135-.96v2.148l-2.134.961V9.504zm0 9.963v-6.702l2.135-.972v6.714l-2.134.96z",
    fillOpacity: 0.5
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M6.765 5.48v2.172l5.77 2.803-5.77 2.857v2.142l8.336 4.03v-2.156L9.44 14.575l5.66-2.91v-2.15L6.766 5.48z"
  }));
}
ZIL.DefaultColor = DefaultColor;
var ZIL_default = ZIL;
//# sourceMappingURL=ZIL.js.map
