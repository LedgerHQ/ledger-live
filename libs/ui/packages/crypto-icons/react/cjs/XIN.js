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
  default: () => XIN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1EB5FA";
function XIN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M19.836 5.501L17.113 6.71a.504.504 0 00-.262.442v9.735a.495.495 0 00.27.443l2.722 1.177a.254.254 0 00.375-.225V5.726a.262.262 0 00-.382-.225zM6.796 6.694l-2.64-1.2a.254.254 0 00-.374.225v12.555a.256.256 0 00.39.217l2.655-1.402a.5.5 0 00.24-.428V7.136a.525.525 0 00-.27-.442zm8.28 3.322L12.235 8.39a.501.501 0 00-.502 0L8.837 10a.513.513 0 00-.255.443v3.3c0 .182.097.35.255.442l2.895 1.665c.155.09.347.09.502 0l2.843-1.65a.514.514 0 00.255-.442v-3.3a.505.505 0 00-.255-.443z"
  }));
}
XIN.DefaultColor = DefaultColor;
var XIN_default = XIN;
//# sourceMappingURL=XIN.js.map
