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
  default: () => SOL_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#000";
function SOL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M2.41 7.77h15.68a.51.51 0 00.37-.16l3.43-3.67a.4.4 0 00-.3-.67H5.91a.51.51 0 00-.37.16L2.11 7.1a.4.4 0 00.3.67zM2.41 20.77h15.68a.51.51 0 00.37-.16l3.43-3.67a.4.4 0 00-.3-.67H5.91a.51.51 0 00-.37.16L2.11 20.1a.4.4 0 00.3.67zM21.59 14.27H5.91a.51.51 0 01-.37-.16l-3.43-3.67a.4.4 0 01.3-.67h15.68a.51.51 0 01.37.16l3.43 3.67a.4.4 0 01-.3.67z"
  }));
}
SOL.DefaultColor = DefaultColor;
var SOL_default = SOL;
//# sourceMappingURL=SOL.js.map
