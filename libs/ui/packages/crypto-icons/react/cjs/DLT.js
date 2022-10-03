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
  default: () => DLT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F4AE95";
function DLT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.855 7.468l-4.57 9.756h7.587a.55.55 0 01.505.341l.008.019a.481.481 0 01-.023.42.72.72 0 01-.626.371H6.672a.62.62 0 01-.35-.109l-.042-.028a.655.655 0 01-.217-.818l5.392-11.362a.929.929 0 01.235-.307.519.519 0 01.67-.008.372.372 0 01.1.13l5.47 11.438a.71.71 0 01.044.5.427.427 0 01-.411.317H17.5a.657.657 0 01-.596-.387L12.187 7.47a.184.184 0 00-.165-.109.183.183 0 00-.167.107z"
  }));
}
DLT.DefaultColor = DefaultColor;
var DLT_default = DLT;
//# sourceMappingURL=DLT.js.map
