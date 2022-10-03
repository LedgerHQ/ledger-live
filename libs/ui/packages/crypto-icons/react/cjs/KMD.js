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
  default: () => KMD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2B6680";
function KMD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M3.75 11.992a8.25 8.25 0 1016.5.032v-.063a8.296 8.296 0 00-.226-1.886.885.885 0 10-1.721.41 6.484 6.484 0 11-4.8-4.796.885.885 0 00.41-1.722A8.249 8.249 0 003.75 11.992z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16.17 5.958c-.012.01-.02.024-.03.036a1.304 1.304 0 00-.351.78v.14c0 .033-.007.064-.01.096a2.357 2.357 0 01-3.06 2.014 3.035 3.035 0 00-2.787.727c-.03.028-.063.052-.092.081a3.053 3.053 0 104.317 4.317 2.98 2.98 0 00.342-.416 3.052 3.052 0 00.467-2.453 2.383 2.383 0 01-.045-.166c0-.009-.005-.016-.007-.025a2.357 2.357 0 012.1-2.878c.017 0 .034-.005.051-.006.05 0 .1-.006.15-.006h.011c.305-.028.59-.162.806-.379.052-.053.098-.11.14-.171a1.315 1.315 0 00-2.001-1.69"
  }));
}
KMD.DefaultColor = DefaultColor;
var KMD_default = KMD;
//# sourceMappingURL=KMD.js.map
