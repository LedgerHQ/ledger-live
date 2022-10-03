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
  default: () => MANA_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FF2D55";
function MANA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M9.595 8.65L4.31 14.991A8.248 8.248 0 0112 3.75 8.248 8.248 0 0120.25 12c0 2.52-1.13 4.777-2.912 6.29H6.662c-.467-.4-.89-.85-1.262-1.34h9.421v-3.572l2.974 3.572h.805l-3.782-4.537-1.044 1.253L9.596 8.65h-.001zm5.223-1.6a2.063 2.063 0 000 4.125 2.064 2.064 0 000-4.125zM9.596 5.557a1.032 1.032 0 10-.055 2.063 1.032 1.032 0 00.055-2.063zM7.492 18.909h9.017A8.227 8.227 0 0112 20.25a8.227 8.227 0 01-4.508-1.341zm5.882-4.76l-1.82 2.182H4.98a8.288 8.288 0 01-.668-1.34h5.285V9.615l3.778 4.534z"
  }));
}
MANA.DefaultColor = DefaultColor;
var MANA_default = MANA;
//# sourceMappingURL=MANA.js.map
