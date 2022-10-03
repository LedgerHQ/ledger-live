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
  default: () => WAX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F89022";
function WAX({
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
    d: "M21 13.847h-1.773l-1.258-1.077-1.253 1.072h-1.499l-.716-.87h-2.469l.625-.772h1.214l-.925-1.13L9.719 15H8.22l.934-1.142h-1.56l-.844-2.365-.837 2.348H4.33L3 10.155h1.215l.894 2.51L6 10.166h1.5l.889 2.493.888-2.494h1.219l-1.341 3.692.298-.364 2.739-3.334H13.7l2.279 2.781 1.096-.943L13.605 9h1.781L21 13.847zm-1.759-2.23l-.836-.717.835-.71 1.687.001-1.686 1.426z"
  }));
}
WAX.DefaultColor = DefaultColor;
var WAX_default = WAX;
//# sourceMappingURL=WAX.js.map
