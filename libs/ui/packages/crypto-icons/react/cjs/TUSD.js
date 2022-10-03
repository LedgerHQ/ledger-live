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
  default: () => TUSD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2B2E7F";
function TUSD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.79 14.577v-4.395h.578c1.909 0 2.38-1.78 2.38-1.78h-5.013c-2.379 0-2.782 1.781-2.782 1.781h2.957v6.613s1.88-.565 1.88-2.219z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M18.294 18.002c1.686-1.752 2.333-4.185 1.726-6.512a7.005 7.005 0 00-1.86-3.21c-.081-.08-.162-.161-.256-.24l-.081-.08a1.642 1.642 0 00-.176-.148l-.108-.08-.161-.12-.096-.067a3.107 3.107 0 01-.188-.134l-.122-.08a.915.915 0 00-.161-.093l-.122-.08c-.054-.027-.108-.068-.162-.094l-.121-.068c-.054-.026-.108-.053-.176-.08l-.041-.013a6.563 6.563 0 01.431 9.708c-3.29 3.263-8.629 3.263-11.92 0-.121-.12-.229-.24-.35-.36l-.094-.107a4.35 4.35 0 01-.203-.254 8.89 8.89 0 001.632 2.246c3.438 3.41 9.02 3.41 12.458 0a.46.46 0 00.151-.135z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M7.798 17.096a6.14 6.14 0 01-.432-.388 6.567 6.567 0 010-9.33c3.293-3.265 8.637-3.265 11.93 0 .23.229.445.47.648.724a8.837 8.837 0 00-1.633-2.235c-3.441-3.413-9.029-3.413-12.47 0-.04.04-.08.094-.135.133-2.28 2.383-2.591 5.943-.769 8.647a7.227 7.227 0 002.861 2.449z"
  }));
}
TUSD.DefaultColor = DefaultColor;
var TUSD_default = TUSD;
//# sourceMappingURL=TUSD.js.map
