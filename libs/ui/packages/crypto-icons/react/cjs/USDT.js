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
  default: () => USDT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00A478";
function USDT({
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
    d: "M13.473 12.501V12.5c-.083.006-.508.031-1.457.031a31.6 31.6 0 01-1.478-.031v.002c-2.916-.128-5.092-.636-5.092-1.243 0-.607 2.176-1.115 5.092-1.245v1.983c.19.013.737.045 1.491.045.905 0 1.36-.037 1.444-.045v-1.982c2.91.13 5.081.638 5.081 1.244 0 .607-2.171 1.113-5.081 1.242zm0-2.692V8.034h4.06V5.328H6.479v2.706h4.06v1.774c-3.3.152-5.782.806-5.782 1.589 0 .783 2.482 1.436 5.782 1.588v5.687h2.935v-5.688c3.295-.152 5.77-.805 5.77-1.587 0-.783-2.475-1.436-5.77-1.588z"
  }));
}
USDT.DefaultColor = DefaultColor;
var USDT_default = USDT;
//# sourceMappingURL=USDT.js.map
