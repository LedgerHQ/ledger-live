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
  default: () => FUEL_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#4096D0";
function FUEL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M19.149 7.5h-4.871l-1.445 3.623H8.278V9.257h4.555L13.5 7.5H6.601a.322.322 0 00-.324.32v3.302h-1.11L4.5 12.878h1.777v3.298c0 .179.147.324.329.324h3.338l.667-1.756H8.278v-1.867h3.777L10.611 16.5h2.222l1.556-3.623h4.785c.18 0 .326-.144.326-.321v-4.71a.349.349 0 00-.351-.346zm-1.538 3.345a.279.279 0 01-.28.277h-2.275l.777-1.864h1.496a.28.28 0 01.283.276v1.311z"
  }));
}
FUEL.DefaultColor = DefaultColor;
var FUEL_default = FUEL;
//# sourceMappingURL=FUEL.js.map
