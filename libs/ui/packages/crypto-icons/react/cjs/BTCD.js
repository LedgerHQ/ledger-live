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
  default: () => BTCD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F60";
function BTCD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.809 14.517c3.81-1.175 2.45-5.125 0-5.275.622 0 1.13-1.783 1.13-3.992 5.983.425 8.793 10.283-.18 13.367.058-.8-.27-3.034-.95-4.1zM4.5 13.35v-4.1h.008c2.163-.008 3.908-1.8 3.901-3.992h4.17c0 4.475-3.613 8.092-8.079 8.092zm5.465-.742c2.475 2.034 2.615 5.459 2.615 6.142H8.409c0-2.267-1.475-4.1-3.302-4.1 3.097-.5 3.728-1.025 4.858-2.042z"
  }));
}
BTCD.DefaultColor = DefaultColor;
var BTCD_default = BTCD;
//# sourceMappingURL=BTCD.js.map
