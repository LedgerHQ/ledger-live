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
  default: () => PIRL_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#96B73D";
function PIRL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.695 12.079c.065.193.16.375.283.538l-1.87-1.888a1.05 1.05 0 010-1.478l2.359-2.36a1.88 1.88 0 00.14-.115l.068-.06 1.91-1.912a1.03 1.03 0 011.465.002l6.258 6.302a1.056 1.056 0 01-.755 1.66 1.067 1.067 0 01-.694-.163l-5.527-5.58-.006-.007-.018-.02L9.35 9.956l-.045.038A.188.188 0 019.3 10l2.922 2.945a1.049 1.049 0 01-.465 1.749 1.032 1.032 0 01-1.002-.27l-1.497-1.508c-.022-.02-.044-.045-.07-.072l-.07-.07a1.936 1.936 0 01-.14-.177l.034.04-.023-.03a1.899 1.899 0 01-.294-.528zm6.11 1.93l-2.926-2.947a1.05 1.05 0 01.337-1.703 1.034 1.034 0 011.13.228l1.498 1.508c.02.018.042.045.07.071l.068.069c.04.043.075.09.108.137l.017.02a4.04 4.04 0 00-.065-.089L17 13.273a1.05 1.05 0 010 1.48l-2.36 2.36c-.05.036-.097.074-.143.114l-1.968 1.968a1.033 1.033 0 01-1.465 0l-6.358-6.41a1.056 1.056 0 01.139-1.408 1.038 1.038 0 011.404.008l5.538 5.591.018.023 2.952-2.95.043-.036a.095.095 0 01.005-.005z"
  }));
}
PIRL.DefaultColor = DefaultColor;
var PIRL_default = PIRL;
//# sourceMappingURL=PIRL.js.map
