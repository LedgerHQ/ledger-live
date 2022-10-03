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
  default: () => PPP_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#348F8D";
function PPP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M17.483 5.283a.998.998 0 010 1.384l-2.347 2.407a.968.968 0 01-.257.188.893.893 0 01-1.081-.159l-2.339-2.395-4.503 4.62 1.087 1.111a.878.878 0 01-.005 1.215.829.829 0 01-1.187.006l-1.73-1.765a.88.88 0 010-1.224l.013-.011a.162.162 0 00.01-.012l5.718-5.865h.001l.02-.02a.86.86 0 011.116-.106.923.923 0 01.15.126l2.238 2.29 1.746-1.79a.94.94 0 011.351 0zm1.394 6.826a.874.874 0 010 1.22l-.011.012a.15.15 0 00-.012.011l-5.74 5.885a.862.862 0 01-1.316-.09l-2.187-2.238-1.735 1.783a.94.94 0 01-.925.257.97.97 0 01-.678-.694.994.994 0 01.251-.947l2.347-2.406a.936.936 0 01.493-.271.899.899 0 01.84.252l2.344 2.398 4.495-4.608-1.087-1.112a.878.878 0 01.005-1.215.828.828 0 011.186-.005l1.705 1.744.002.001.002.002.02.021z"
  }));
}
PPP.DefaultColor = DefaultColor;
var PPP_default = PPP;
//# sourceMappingURL=PPP.js.map
