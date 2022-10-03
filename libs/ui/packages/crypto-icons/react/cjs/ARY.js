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
  default: () => ARY_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#343434";
function ARY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M17.938 15.832a.636.636 0 00.427-.645v.825a.682.682 0 01-.446.645l-5.691 2.05a.605.605 0 01-.447 0L6.09 16.658a.675.675 0 01-.446-.645v-.825c0 .284.176.55.446.645l5.71 2.05a.605.605 0 00.446 0l5.692-2.05zm0-1.46a.65.65 0 00.427-.646v.825a.682.682 0 01-.446.645l-5.691 2.05a.605.605 0 01-.447 0L6.09 15.197a.675.675 0 01-.446-.645v-.835c0 .294.176.55.446.654l5.71 2.05a.605.605 0 00.446 0l5.692-2.05zm0-1.47a.66.66 0 00.437-.637v.825a.682.682 0 01-.447.645l-5.691 2.05a.605.605 0 01-.446 0L6.09 13.726a.675.675 0 01-.446-.645v-.825c0 .285.176.55.446.645l5.71 2.05a.605.605 0 00.446 0l5.692-2.05zM5.625 7.995a.675.675 0 01.446-.645l5.701-2.058a.604.604 0 01.446 0L17.92 7.35a.675.675 0 01.446.645v3.624a.682.682 0 01-.446.645l-5.71 2.05a.605.605 0 01-.446 0l-5.692-2.05a.675.675 0 01-.446-.645V7.996z"
  }));
}
ARY.DefaultColor = DefaultColor;
var ARY_default = ARY;
//# sourceMappingURL=ARY.js.map
