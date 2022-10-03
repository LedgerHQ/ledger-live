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
  default: () => NXT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#008FBB";
function NXT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M19.561 12.625c-.38 0-.688-.28-.688-.625v-.626h-3.459c-.38 0-.688-.28-.688-.624 0-.345.308-.625.688-.625h4.147c.38 0 .689.28.689.625V12c0 .345-.308.625-.689.625zm-3.411 0h1.376c.38 0 .689.28.689.624 0 .345-.308.626-.689.626h-2.112a.74.74 0 01-.317-.07l-4.014-2.43H9.926c-.38 0-.688-.28-.688-.625s.307-.625.688-.625h1.377c.148 0 .285.043.398.116l3.924 2.385h.525v-.001zm-4.847 0c.38 0 .688.28.688.624 0 .345-.308.626-.688.626H9.925a.74.74 0 01-.317-.07l-4.014-2.43H4.439c-.38 0-.689-.28-.689-.625s.308-.625.689-.625h1.376c.14 0 .28.04.398.116l3.924 2.385h1.165v-.001zm-6.865 0h1.377c.38 0 .688.28.688.625s-.308.625-.688.625H4.438c-.38 0-.688-.28-.688-.625s.308-.625.689-.625z"
  }));
}
NXT.DefaultColor = DefaultColor;
var NXT_default = NXT;
//# sourceMappingURL=NXT.js.map
