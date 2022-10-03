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
  default: () => CELO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#42D689";
function CELO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M10.105 19.105a5.21 5.21 0 100-10.42 5.21 5.21 0 100 10.42zm0 1.895a7.105 7.105 0 110-14.21 7.105 7.105 0 010 14.21z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M13.895 15.316a5.21 5.21 0 100-10.421 5.21 5.21 0 100 10.42zm0 1.894a7.105 7.105 0 110-14.21 7.105 7.105 0 010 14.21z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14.13 17.21a5.188 5.188 0 001.032-2.048c.75-.187 1.45-.54 2.048-1.032a7.054 7.054 0 01-.553 2.53 7.073 7.073 0 01-2.527.55zM8.838 8.838c-.75.187-1.45.54-2.049 1.032.027-.87.215-1.726.554-2.527a7.124 7.124 0 012.527-.554 5.187 5.187 0 00-1.032 2.049z"
  }));
}
CELO.DefaultColor = DefaultColor;
var CELO_default = CELO;
//# sourceMappingURL=CELO.js.map
