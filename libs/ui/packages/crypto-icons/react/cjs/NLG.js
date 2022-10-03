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
  default: () => NLG_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2AB0FD";
function NLG({
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
    d: "M19.136 11.104c.124-.002.203.015.252.06.053.048.074.126.085.248.35 4.034-2.702 7.68-6.749 8.055-4.173.386-7.795-2.625-8.191-6.81-.386-4.064 2.666-7.751 6.74-8.122 2.306-.21 4.298.515 5.975 2.112.018.017.014.086-.006.105-.376.384-.756.764-1.14 1.14-.021.022-.1.019-.123-.003-1.73-1.585-3.735-2.055-5.928-1.256-2.217.808-3.485 2.48-3.736 4.835-.338 3.187 2.068 5.996 5.276 6.238 2.909.219 5.544-1.84 6.026-4.714.005-.028-.06-.1-.093-.1-1.796-.005-3.592-.003-5.388-.01-.046 0-.132-.086-.134-.134-.01-.502-.01-1.004 0-1.506 0-.045.081-.126.125-.126 1.197-.007 5.87.003 7.008-.013h.001z"
  }));
}
NLG.DefaultColor = DefaultColor;
var NLG_default = NLG;
//# sourceMappingURL=NLG.js.map
