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
  default: () => SPHTX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00B098";
function SPHTX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M4.5 8.918v-.267h6.313v.267H4.5zm0-.776v-.267h6.313v.267H4.5zm2.662 7.98v-6.67h.254v6.67h-.254zm.736 0v-6.67h.252v6.67h-.253zm11.424-.546l-2.849-3.01.178-.188 2.849 3.009-.178.189zm-6.933-7.701l2.849 3.01-.179.188-2.848-3.009.178-.189zm6.413 8.25l-2.849-3.01.179-.189 2.848 3.01-.178.189zM11.87 8.424l2.849 3.009-.18.189-2.848-3.009.18-.189zM15.936 12l.18-.189 3.206-3.387.178.189L16.294 12l-.179.189-.34.36-.18.189-3.205 3.387-.179-.189 3.207-3.387.178-.189.34-.36zm-.34-.738l3.206-3.387.179.189-3.206 3.387-.179.189-.34.36-.18.189-3.205 3.387-.18-.189L14.899 12l.178-.189.342-.36.178-.189z"
  }));
}
SPHTX.DefaultColor = DefaultColor;
var SPHTX_default = SPHTX;
//# sourceMappingURL=SPHTX.js.map
