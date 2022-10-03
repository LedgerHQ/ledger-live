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
  default: () => MDS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1E252C";
function MDS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M10.665 11.692a1.13 1.13 0 110-2.261 1.13 1.13 0 010 2.26zm2.774 0a1.13 1.13 0 110-2.261 1.13 1.13 0 010 2.26zm-2.775 2.774a1.13 1.13 0 110-2.26 1.13 1.13 0 010 2.26zm2.774 0a1.13 1.13 0 110-2.26 1.13 1.13 0 010 2.26zm2.774-3.083a.823.823 0 110-1.645.823.823 0 010 1.645zm0 2.775a.822.822 0 110-1.644.822.822 0 010 1.644zm-8.424-2.775a.822.822 0 110-1.643.822.822 0 010 1.643zm0 2.775a.822.822 0 110-1.645.822.822 0 010 1.645zm2.876 2.773a.823.823 0 11-.05-1.644.823.823 0 01.05 1.644zm2.774 0a.822.822 0 11-.05-1.644.822.822 0 01.05 1.644zM10.665 8.61a.822.822 0 11-.05-1.644.822.822 0 01.05 1.644zm2.774 0a.822.822 0 11-.05-1.643.822.822 0 01.05 1.643zm-2.774-3.083a.514.514 0 110-1.026.514.514 0 110 1.027zm2.774 0a.513.513 0 110-1.026.514.514 0 010 1.027zm5.548 5.549a.514.514 0 110-1.028.514.514 0 010 1.028zm0 2.774a.513.513 0 110-1.027.513.513 0 010 1.027zM5.014 11.076a.514.514 0 110-1.028.514.514 0 010 1.028zm0 2.774a.514.514 0 110-1.027.514.514 0 010 1.027zm5.65 5.65a.514.514 0 110-1.028.514.514 0 010 1.028zm2.774 0a.514.514 0 110-1.028.514.514 0 010 1.028z"
  }));
}
MDS.DefaultColor = DefaultColor;
var MDS_default = MDS;
//# sourceMappingURL=MDS.js.map
