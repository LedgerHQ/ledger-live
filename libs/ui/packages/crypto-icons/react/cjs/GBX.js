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
  default: () => GBX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1666AF";
function GBX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.774 8.255v1.544H8.25c-.457 0-1.02.161-1.44.458-.52.369-.81.922-.81 1.745 0 .824.29 1.377.81 1.745.42.297.983.458 1.44.458h1.5v1.545h-1.5a4.086 4.086 0 01-2.29-.73c-.921-.654-1.459-1.678-1.459-3.018 0-1.34.538-2.364 1.459-3.018a4.085 4.085 0 012.29-.73h3.525zm-3.75 4.636v-1.545h3.75v4.404h-1.499v-2.859h-2.25zm6.226-3.096V8.25h5.25v7.5h-6.752V9.8h1.5v4.404H18V9.796l-3.75-.001z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.774 8.255v1.544H8.25c-.457 0-1.02.161-1.44.458-.52.369-.81.922-.81 1.745 0 .824.29 1.377.81 1.745.42.297.983.458 1.44.458h1.5v1.545h-1.5a4.086 4.086 0 01-2.29-.73c-.921-.654-1.459-1.678-1.459-3.018 0-1.34.538-2.364 1.459-3.018a4.085 4.085 0 012.29-.73h3.525zm-3.75 4.636v-1.545h3.75v4.404h-1.499v-2.859h-2.25zm6.226-3.096V8.25h5.25v7.5h-6.752V9.8h1.5v4.404H18V9.796l-3.75-.001z"
  }));
}
GBX.DefaultColor = DefaultColor;
var GBX_default = GBX;
//# sourceMappingURL=GBX.js.map
