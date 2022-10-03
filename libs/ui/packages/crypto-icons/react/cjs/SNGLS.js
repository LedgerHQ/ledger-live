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
  default: () => SNGLS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#B30D23";
function SNGLS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.699 15.562L12 16.864l-.699-1.302c-4.223-.328-7.537-3.476-7.537-3.476 0-.008 3.22-3.059 7.357-3.461l.547-.938.332-.55.563.937.316.551c4.136.394 7.357 3.46 7.357 3.46s-3.315 3.149-7.538 3.477h.001zm-8.236-3.476c-.007 0 3.185 2.18 6.391 2.642l-1.563-2.925.425-.737.39.73-.008.007 1.52 2.992c.123.008.245.008.368.008.122 0 .237 0 .36-.008l1.117-2.226.814-1.518.425.737-1.563 2.932c3.206-.454 6.397-2.582 6.397-2.642 0-.053-3.04-2.084-6.167-2.605l.475.827-.396.795-1.03-1.726A7.847 7.847 0 0012 9.354c-.137 0-.281.007-.425.015l-1.052 1.726-.389-.759.496-.855c-3.126.528-6.167 2.604-6.167 2.604z"
  }));
}
SNGLS.DefaultColor = DefaultColor;
var SNGLS_default = SNGLS;
//# sourceMappingURL=SNGLS.js.map
