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
  default: () => GVT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#16B9AD";
function GVT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M19.5 8.77c0 4.056-3.365 7.355-7.5 7.355s-7.5-3.3-7.5-7.354c0-.298.018-.598.056-.895h1.346a5.96 5.96 0 00-.067.895c0 3.334 2.766 6.047 6.166 6.047 3.244 0 5.911-2.47 6.15-5.591H8.61c.203 1.457 1.352 2.615 2.833 2.855 1.481.238 2.947-.498 3.616-1.815h1.444c-.656 1.891-2.467 3.163-4.505 3.165-2.621 0-4.755-2.092-4.755-4.662 0-.3.03-.6.087-.895h12.114c.038.297.056.595.056.895z"
  }));
}
GVT.DefaultColor = DefaultColor;
var GVT_default = GVT;
//# sourceMappingURL=GVT.js.map
