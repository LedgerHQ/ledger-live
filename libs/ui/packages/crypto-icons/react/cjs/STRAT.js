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
  default: () => STRAT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1387C9";
function STRAT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.04 13.78l7.195-4.188-7.195-4.263-7.124 4.263 7.124 4.188zm-7.505-2.19a.57.57 0 00.282.493l7.22 4.206 7.34-4.341a.553.553 0 01.831.48v1.97a.557.557 0 01-.27.477l-7.618 4.547a.549.549 0 01-.56.002L3.945 14.83a.397.397 0 01.097-.724.392.392 0 01.298.04l7.698 4.526 7.385-4.409v-1.425l-7.105 4.202a.55.55 0 01-.556.003l-7.338-4.275a1.36 1.36 0 01-.674-1.178V9.735a.473.473 0 01.71-.41l.456.267-.573.343a.39.39 0 01-.588-.273.397.397 0 01.188-.407l7.814-4.677a.549.549 0 01.563-.001l7.658 4.537a.559.559 0 01-.004.961l-7.659 4.458a.549.549 0 01-.555 0l-7.695-4.525a.312.312 0 00.471-.273v1.856-.001z"
  }));
}
STRAT.DefaultColor = DefaultColor;
var STRAT_default = STRAT;
//# sourceMappingURL=STRAT.js.map
