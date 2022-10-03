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
  default: () => CRO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#002D74";
function CRO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12 2L3.5 7.011v9.978L12 22l8.5-5.011V7.01L12 2zm5.99 13.512L12 19.002l-5.99-3.49V8.488L12 4.953l5.99 3.535v7.024z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 4.953V2L3.5 7.011v9.978L12 22v-2.998l-5.99-3.49V8.488L12 4.953zM12 19.002v2.953l8.5-5.01V7.01L12 2v2.953l5.99 3.49v7.025L12 19.002z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16.008 14.304L12 16.63l-3.963-2.327V9.65L12 7.324l4.008 2.327v4.653z"
  }));
}
CRO.DefaultColor = DefaultColor;
var CRO_default = CRO;
//# sourceMappingURL=CRO.js.map
