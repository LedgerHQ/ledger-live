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
  default: () => RYO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#3D58B0";
function RYO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12 3.011c-4.957 0-8.989 4.032-8.989 8.99 0 4.957 4.032 8.988 8.99 8.988 4.957 0 8.988-4.032 8.988-8.988 0-4.958-4.032-8.99-8.988-8.99zm0 1.224a7.756 7.756 0 017.765 7.766 7.754 7.754 0 01-7.764 7.764 7.755 7.755 0 01-7.766-7.764 7.756 7.756 0 017.766-7.766z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.66 8.681v6.638h6.68V8.68H8.66zM9.749 9.77h4.503v4.462H9.75V9.77z"
  }));
}
RYO.DefaultColor = DefaultColor;
var RYO_default = RYO;
//# sourceMappingURL=RYO.js.map
