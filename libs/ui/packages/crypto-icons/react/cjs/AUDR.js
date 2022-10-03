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
  default: () => AUDR_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#34318A";
function AUDR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M7.068 9.948l2.707 1.44 1.44-.72-3.442-1.865V5.52l6.618 3.435 1.44-.72-8.475-4.443a.634.634 0 00-.929.562v4.55c.002.44.25.843.64 1.044zm10.317-.764a.634.634 0 00-.72-.114l-9.597 4.982a1.18 1.18 0 00-.64 1.052v4.542a.634.634 0 00.928.562l9.576-4.968c.4-.207.648-.623.64-1.072V9.63a.626.626 0 00-.187-.447zm-1.152 4.904l-8.46 4.392v-3.284l8.46-4.391v3.283z"
  }));
}
AUDR.DefaultColor = DefaultColor;
var AUDR_default = AUDR;
//# sourceMappingURL=AUDR.js.map
