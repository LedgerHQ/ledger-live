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
  default: () => CIX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0576B4";
function CIX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M17.717 13.911l-.794-.497 1.733-.02.036-.02v.019l.715-.008-1.214 1.976-.109-.953-5.523 3.048-2.095-2.797-5.872 3.094v-.705l6.055-3.19 2.094 2.797 4.975-2.744zm-7.584-.679l-2.295 1.209V6.246h2.295v6.985zm6.49.361l-2.295 1.275V6.247h2.295v7.346z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.5,
    d: "M13.378 15.396l-.492.273-1.803-2.408V7.184h2.295v8.212zm-6.49-.455L4.593 16.15V8.248h2.295v6.693z"
  }));
}
CIX.DefaultColor = DefaultColor;
var CIX_default = CIX;
//# sourceMappingURL=CIX.js.map
