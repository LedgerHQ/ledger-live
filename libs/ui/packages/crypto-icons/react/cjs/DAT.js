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
  default: () => DAT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2D9CDB";
function DAT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M16.31 4.464c.295 0 .532.09.71.27.18.179.27.415.27.71v8.755c0 .998-.237 1.907-.71 2.726a5.16 5.16 0 01-1.901 1.92c-.794.46-1.683.691-2.67.691-.985 0-1.887-.23-2.707-.69a5.161 5.161 0 01-1.9-1.92c-.461-.82-.691-1.729-.691-2.727 0-.998.21-1.901.633-2.707.435-.82 1.024-1.46 1.767-1.92a4.738 4.738 0 012.514-.692 4.73 4.73 0 013.706 1.748V5.444c0-.295.09-.531.27-.71a.997.997 0 01.71-.27zm-4.3 13.344c.64 0 1.216-.153 1.727-.46a3.35 3.35 0 001.23-1.305 3.855 3.855 0 00.441-1.844c0-.678-.147-1.287-.442-1.824a3.215 3.215 0 00-1.229-1.287 3.195 3.195 0 00-1.728-.48c-.64 0-1.222.16-1.747.48-.517.312-.94.757-1.229 1.287-.294.537-.44 1.145-.44 1.824s.146 1.292.44 1.843c.292.533.715.983 1.23 1.306.525.307 1.107.46 1.747.46z"
  }));
}
DAT.DefaultColor = DefaultColor;
var DAT_default = DAT;
//# sourceMappingURL=DAT.js.map
