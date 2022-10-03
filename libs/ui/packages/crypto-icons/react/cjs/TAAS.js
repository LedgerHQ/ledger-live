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
  default: () => TAAS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#002342";
function TAAS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M3 9.75h.974v.916H3V9.75zm.974 3.58h2.832v.92H3v-2.668h2.857v.914H3.974v.835zm13.22-1.748H21v2.668h-2.858v-.92h1.884v-.833h-2.832v-.915zm2.848-.872h-2.85v-.916h2.85v.916zm-12.308.871h3.806v1.789h-.948v.88H7.734v-2.668zm2.833 1.75v-.834h-1.86v.833h1.86zM7.734 9.75h3.806v.916H7.734V9.75zm4.75 1.832h3.807v1.787h-.948v.881h-2.858v-2.668zm2.83 1.748v-.833h-1.86v.833h1.86zm-2.83-3.58h3.807v.916h-3.806V9.75z"
  }));
}
TAAS.DefaultColor = DefaultColor;
var TAAS_default = TAAS;
//# sourceMappingURL=TAAS.js.map
