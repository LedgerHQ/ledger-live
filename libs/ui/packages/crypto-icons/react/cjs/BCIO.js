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
  default: () => BCIO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#3F43AD";
function BCIO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.973 5.877a.658.658 0 000 1.313.658.658 0 000-1.313zm3.038-1.823a.658.658 0 000 1.314.658.658 0 000-1.314zm0 7.29a.657.657 0 000 1.313.658.658 0 000-1.314zm3.037-1.823a.657.657 0 10.001 1.314.657.657 0 00-.001-1.314zm3.036-1.822a.658.658 0 10-.042 1.315.658.658 0 00.042-1.315zm-9.11 5.467a.658.658 0 000 1.313.658.658 0 000-1.313zM5.935 7.699a.657.657 0 10.001 1.314.657.657 0 00-.001-1.314zm0 7.289a.658.658 0 10.001 1.315.658.658 0 00-.001-1.315zm0-3.645a.658.658 0 000 1.314.658.658 0 000-1.314zM12.01 7.7a.657.657 0 10-.045 1.314.657.657 0 00.045-1.314zm3.037-1.822a.658.658 0 10-.043 1.315.658.658 0 00.043-1.315zm0 7.289a.657.657 0 100 1.314.657.657 0 000-1.314zm3.036-1.823a.657.657 0 000 1.314.658.658 0 000-1.314zm-3.036 5.467a.658.658 0 100 1.317.658.658 0 000-1.317zm3.036-1.822a.657.657 0 000 1.314.658.658 0 000-1.314zm-6.073 3.645a.658.658 0 000 1.313.658.658 0 000-1.313zm0-3.645a.659.659 0 10.001 1.317.659.659 0 00-.001-1.317zM8.973 9.52a.658.658 0 000 1.313.658.658 0 000-1.312V9.52zm0 7.29a.658.658 0 000 1.312.658.658 0 000-1.313z"
  }));
}
BCIO.DefaultColor = DefaultColor;
var BCIO_default = BCIO;
//# sourceMappingURL=BCIO.js.map
