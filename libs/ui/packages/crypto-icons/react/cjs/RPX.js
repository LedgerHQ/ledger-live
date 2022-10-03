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
  default: () => RPX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#8D181B";
function RPX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.897 11.799c.54 0 .978.427.978.956a.967.967 0 01-.978.956.978.978 0 01-.909-.603h-2.79l-1.029 1.83c-.17.301-.634.212-.674-.13l-.231-1.955-.855 6.34c-.057.422-.688.403-.717-.022l-.701-10.25-.743 6.79c-.045.406-.64.427-.712.025l-.787-4.317-.363 1.422a.36.36 0 01-.349.267H4.485a.356.356 0 01-.36-.353c0-.195.161-.352.36-.352h3.27l.704-2.754c.095-.369.636-.35.705.024l.637 3.502.914-8.36c.047-.428.689-.416.718.013l.736 10.755.76-5.643c.056-.411.667-.407.716.006l.436 3.686.588-1.047a.36.36 0 01.316-.182h3.003a.978.978 0 01.909-.604z"
  }));
}
RPX.DefaultColor = DefaultColor;
var RPX_default = RPX;
//# sourceMappingURL=RPX.js.map
