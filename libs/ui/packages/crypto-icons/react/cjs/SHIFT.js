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
  default: () => SHIFT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#964B9C";
function SHIFT({
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
    d: "M15.36 11.997l-3.354 3.353h6.706l-3.352-3.353z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.7,
    d: "M8.625 12l3.354-3.353H5.272L8.626 12z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.4,
    d: "M12.006 15.35l3.345-3.344-3.36-3.362-6.708 6.707 6.707 6.707 6.707-6.707H12.006z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.8,
    d: "M12.021 1.942L5.32 8.645h6.66l-3.334 3.334 3.376 3.376 6.707-6.706-6.707-6.707z"
  }));
}
SHIFT.DefaultColor = DefaultColor;
var SHIFT_default = SHIFT;
//# sourceMappingURL=SHIFT.js.map
