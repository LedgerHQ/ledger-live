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
  default: () => SAFE_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00688C";
function SAFE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M20.244 16.756V7.252l-8.253-4.754-.01.006-8.225 4.753v9.502l8.23 4.742h.002l8.256-4.744zm-3.652-1.519l-1.408-.807-3.14 1.823a.06.06 0 01-.06 0l-3.605-2.088-.001-3.634-3.166-1.815 6.749-3.956a.017.017 0 01.018 0l6.267 3.583-1.108.641-5.156-2.967-4.573 2.685 1.586.91 2.99-1.738.001-.001 3.653 2.089-.002 3.457 3.113 1.783v.052l-6.762 3.948-6.269-3.579 1.097-.643 5.161 2.96 4.615-2.704v.001z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12.981 11.112V11.07l-.001-.009-.002-.019v-.006l-.002-.02v-.005l-.003-.021v-.004l-.003-.022v-.003l-.004-.022v-.002l-.005-.022v-.002l-.006-.023v-.002a.253.253 0 00-.005-.022v-.002l-.007-.022-.007-.025a.371.371 0 00-.015-.045l-.009-.023a.31.31 0 00-.009-.023l-.01-.022-.01-.021-.01-.022-.01-.021-.012-.022a3.603 3.603 0 01-.012-.02l-.012-.02a.345.345 0 00-.014-.02v-.001l-.012-.018s0-.002-.002-.002l-.013-.018-.001-.001-.013-.018v-.002l-.015-.017-.001-.001-.014-.017-.001-.001-.015-.016-.002-.002-.014-.016-.002-.002-.014-.015-.017-.018-.002-.002-.015-.015-.018-.015-.002-.002a.355.355 0 00-.016-.014l-.002-.003a.325.325 0 00-.016-.012l-.002-.002-.016-.013-.003-.002-.017-.013-.002-.001-.017-.013-.003-.001-.017-.012-.002-.001-.018-.012-.002-.002-.018-.01h-.002l-.02-.013-.021-.012a1.007 1.007 0 00-.858 1.82l-.435 1.989h1.645l-.438-1.988c.376-.157.621-.525.621-.932z"
  }));
}
SAFE.DefaultColor = DefaultColor;
var SAFE_default = SAFE;
//# sourceMappingURL=SAFE.js.map
