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
  default: () => BNB_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F3BA2F";
function BNB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M9.087 10.803L12 7.89l2.915 2.915L16.61 9.11 12 4.5 7.392 9.108l1.695 1.695zM4.5 12l1.695-1.695L7.89 12l-1.695 1.695L4.5 12zm4.587 1.197L12 16.11l2.915-2.915 1.695 1.695L12 19.5l-4.608-4.608-.002-.002 1.697-1.693zM16.11 12l1.695-1.695L19.5 12l-1.695 1.695L16.11 12zm-2.391-.002h.002V12L12 13.72l-1.718-1.717-.003-.003.003-.002.3-.302.147-.146L12 10.28 13.72 12l-.001-.002z"
  }));
}
BNB.DefaultColor = DefaultColor;
var BNB_default = BNB;
//# sourceMappingURL=BNB.js.map
