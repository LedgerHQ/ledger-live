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
  default: () => FSN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1D9AD7";
function FSN({
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
    d: "M21.75 10.659c-.758-.79-2.312-1.452-5.212-1.858a44.92 44.92 0 00-2.752-.299c-.715-.043-1.409-.085-2.08-.085-1.114 1.665-2.165 3.672-3.09 6.085-1.009 2.647-1.912 5.253-2.542 7.623h-.189c.063-2.541.483-5.423 1.345-8.413.568-1.942 1.24-3.652 1.996-5.145-3.405.363-5.842 1.409-6.976 2.903.967-2.37 3.845-4.377 8.237-5.081 2.333-3.481 5.085-5.04 7.376-4.356.798.234 1.47.747 2.017 1.473-.063-.043-.127-.086-.21-.107-1.681-.683-3.95.299-6.157 2.733h.105c4.938-.021 7.438 2.072 8.132 4.527zm-6.178 3.202c1.344 0 2.437 1.132 2.437 2.52 0 1.388-1.093 2.52-2.438 2.52-1.344 0-2.437-1.132-2.437-2.52 0-1.409 1.093-2.52 2.438-2.52z"
  }));
}
FSN.DefaultColor = DefaultColor;
var FSN_default = FSN;
//# sourceMappingURL=FSN.js.map
