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
  default: () => XMO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F60";
function XMO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M21 12a9 9 0 01-9 9A9 9 0 014.771 6.635l1.47 1.47A6.916 6.916 0 005.046 12a6.952 6.952 0 006.947 6.947A6.953 6.953 0 0018.94 12a6.954 6.954 0 00-1.196-3.895l1.47-1.47A8.895 8.895 0 0121 12z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16.978 12A4.983 4.983 0 0112 16.978 4.983 4.983 0 017.021 12c0-.865.225-1.715.654-2.467L12 13.855l4.325-4.324c.428.752.654 1.603.654 2.469"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M17.885 5.194L12 11.072 7.514 6.593l-1.4-1.4A8.93 8.93 0 0112 3c2.25 0 4.303.823 5.885 2.194z"
  }));
}
XMO.DefaultColor = DefaultColor;
var XMO_default = XMO;
//# sourceMappingURL=XMO.js.map
