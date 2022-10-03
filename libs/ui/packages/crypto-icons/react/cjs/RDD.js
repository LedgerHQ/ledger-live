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
  default: () => RDD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#E30613";
function RDD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    opacity: 0.75,
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M11.524 20.25c-4.291 0-7.771-3.445-7.771-7.694 0-4.248 3.48-7.693 7.77-7.693 4.293 0 7.772 3.445 7.772 7.693 0 4.25-3.48 7.694-7.772 7.694zm1.342-13.183c1.812.742 3.114 2.138 4.038 4.019l.697-.486c-.783-1.884-2.23-3.364-4.557-4.324l-.178.791z",
    fillOpacity: 0.5
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M20.247 6.99c0-1.789-1.466-3.24-3.274-3.24-1.807 0-3.273 1.451-3.273 3.24 0 .172.013.342.04.51 1.09.635 1.965 1.546 2.665 2.683.187.032.378.05.568.05 1.808 0 3.274-1.452 3.274-3.242z"
  }));
}
RDD.DefaultColor = DefaultColor;
var RDD_default = RDD;
//# sourceMappingURL=RDD.js.map
