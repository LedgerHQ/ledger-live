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
  default: () => SABI_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function SABI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M9.73 3.033H4.391A11.712 11.712 0 0112 .24C18.495.24 23.76 5.505 23.76 12S18.495 23.76 12 23.76c-2.585 0-4.975-.834-6.916-2.248H9.73a1.058 1.058 0 000-2.116H2.856a11.786 11.786 0 01-1.118-1.649h11.599a1.058 1.058 0 000-2.116H.81a11.68 11.68 0 01-.422-1.755H4.09a1.058 1.058 0 000-2.116H.242c.017-.824.118-1.627.296-2.401h12.826a1.058 1.058 0 000-2.116H1.242C1.57 6.5 1.972 5.8 2.44 5.149h7.29a1.058 1.058 0 000-2.116zm-.152 9.785c0 .584.474 1.058 1.058 1.058h8.728a1.058 1.058 0 000-2.116h-8.728c-.584 0-1.058.473-1.058 1.058zm-2.25-1.058a1.059 1.059 0 10-.001 2.117 1.059 1.059 0 000-2.117zm5.7-8.727a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117zm0 16.363a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117z",
    stroke: "#000",
    strokeWidth: 0.48
  }));
}
SABI.DefaultColor = DefaultColor;
var SABI_default = SABI;
//# sourceMappingURL=SABI.js.map
