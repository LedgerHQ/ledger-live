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
  default: () => MAID_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#5592D7";
function MAID({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M15.975 9.527v9.73l-8.217-4.73c-2.43-1.423-2.276-2.308-2.276-4.23l8.447 4.884v-4.462l2.045-1.192z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.6,
    d: "M13.93 15.18l-8.447-4.884 8.215-4.73c2.43-1.385 3.125-.808 4.822.154l-8.447 4.884 3.857 2.23v2.347z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.2,
    d: "M10.073 10.604L18.52 5.72v9.46c0 2.809-.848 3.116-2.545 4.078v-9.73l-3.897 2.23-2.006-1.154z"
  }));
}
MAID.DefaultColor = DefaultColor;
var MAID_default = MAID;
//# sourceMappingURL=MAID.js.map
