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
  default: () => IGNIS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F9C011";
function IGNIS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.109 4.5c1.139.665 2.21 1.436 3.338 2.119l-4.158 7.253c-.553-.968-1.07-1.956-1.615-2.93.785-2.156 1.682-4.274 2.435-6.442zM7.5 19.5c2.354-4.282 4.8-8.516 7.128-12.81.623 1.093 1.246 2.186 1.872 3.278-1.805 3.174-3.623 6.34-5.413 9.521-1.196 0-2.39-.015-3.587.011zm3.812-.017c.997-1.707 1.937-3.443 2.947-5.142.602.77 1.213 1.537 1.811 2.31a459.48 459.48 0 01-4.758 2.832z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.109 4.5c1.139.665 2.21 1.436 3.338 2.119l-4.158 7.253c-.553-.968-1.07-1.956-1.615-2.93.785-2.156 1.682-4.274 2.435-6.442zM7.5 19.5c2.354-4.282 4.8-8.516 7.128-12.81.623 1.093 1.246 2.186 1.872 3.278-1.805 3.174-3.623 6.34-5.413 9.521-1.196 0-2.39-.015-3.587.011zm3.812-.017c.997-1.707 1.937-3.443 2.947-5.142.602.77 1.213 1.537 1.811 2.31a459.48 459.48 0 01-4.758 2.832z"
  }));
}
IGNIS.DefaultColor = DefaultColor;
var IGNIS_default = IGNIS;
//# sourceMappingURL=IGNIS.js.map
