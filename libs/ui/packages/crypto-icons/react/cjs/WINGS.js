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
  default: () => WINGS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0DC9F7";
function WINGS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M14.178 11.432l-2.284 1.773-.935-3.244L5.541 8.51l7.11.365 1.527 2.557z",
    fillOpacity: 0.2
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M6.203 17.622l12.236-9.497 1.061 2.36-1.391-.385-.049 2.448-11.857 5.074z",
    fillOpacity: 0.5
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M17.097 12.963l-3.56-6.121L4.5 6.378l6.887 1.845 1.868 6.368 3.842-1.628z"
  }));
}
WINGS.DefaultColor = DefaultColor;
var WINGS_default = WINGS;
//# sourceMappingURL=WINGS.js.map
