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
  default: () => COMP_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00D395";
function COMP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M6.615 16.19A1.252 1.252 0 016 15.118v-2.44a.53.53 0 01.537-.523.55.55 0 01.27.071l5.627 3.211c.33.188.533.533.533.905v2.528a.631.631 0 01-.642.63.662.662 0 01-.337-.092L6.615 16.19zm8.388-4.632c.33.188.531.533.533.905v5.13a.415.415 0 01-.219.366l-1.231.678a.219.219 0 01-.05.02v-2.849c0-.369-.198-.71-.522-.9l-4.941-2.893V8.8a.53.53 0 01.537-.524c.095 0 .187.025.27.071l5.624 3.211h-.001zm2.464-3.789c.33.188.533.533.533.907v7.492a.423.423 0 01-.226.37l-1.168.617v-5.217c0-.369-.198-.71-.52-.9l-5.051-2.964v-3.05c0-.092.026-.183.072-.263a.543.543 0 01.732-.19l5.628 3.199z"
  }));
}
COMP.DefaultColor = DefaultColor;
var COMP_default = COMP;
//# sourceMappingURL=COMP.js.map
