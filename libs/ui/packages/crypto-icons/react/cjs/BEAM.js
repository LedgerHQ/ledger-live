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
  default: () => BEAM_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0B76FF";
function BEAM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M20.67 10.238v-1.65l-5.37 3.127L11.985 6v3.75l1.688 2.925-.683.405-1.005-1.77-1.08 1.92-.75-.308 1.83-3.172V6l-3.63 6.18L3.3 10.088V12l4.5 1.11L4.95 18h7.035v-2.018H8.392l1.343-2.354.81.202-.81 1.425h4.5l-.675-1.193.893-.067 1.147 1.988h-3.615V18h7.065l-2.43-4.148 4.08-.3v-1.657l-4.59 1.133 4.582-1.178v-1.5l-4.972 2.018 4.95-2.13zM14.145 13.5l-.81.203.795-.203h.015zm-.255-.45l-.75.3.75-.307v.007z"
  }));
}
BEAM.DefaultColor = DefaultColor;
var BEAM_default = BEAM;
//# sourceMappingURL=BEAM.js.map
