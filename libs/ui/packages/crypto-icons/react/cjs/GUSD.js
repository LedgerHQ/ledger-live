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
  default: () => GUSD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00DCFA";
function GUSD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M14.534 3.75c-2.903 0-5.368 2.232-5.678 5.105-2.875.31-5.106 2.776-5.106 5.678a5.72 5.72 0 005.716 5.717c2.903 0 5.378-2.232 5.678-5.105 2.874-.31 5.106-2.776 5.106-5.678a5.72 5.72 0 00-5.716-5.717zm4.376 6.357a4.447 4.447 0 01-3.727 3.728v-3.728h3.727zM5.09 13.893a4.448 4.448 0 013.727-3.737v3.727H5.089v.01zm8.754 1.29a4.42 4.42 0 01-4.377 3.776 4.42 4.42 0 01-4.378-3.775h8.755v-.001zm.049-5.076v3.776h-3.786v-3.776h3.786zm5.017-1.29h-8.754a4.42 4.42 0 014.377-3.776 4.42 4.42 0 014.377 3.775v.001z"
  }));
}
GUSD.DefaultColor = DefaultColor;
var GUSD_default = GUSD;
//# sourceMappingURL=GUSD.js.map
