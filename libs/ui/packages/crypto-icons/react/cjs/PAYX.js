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
  default: () => PAYX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#630";
function PAYX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.842 7.723l.938-2.297 6.421.023c.938.07 2.063.07 2.695.868.75.867.586 2.109.211 3.093a6.534 6.534 0 01-4.758 4.266c-1.546.235-3.117.164-4.687.164.313-.763.625-1.528.937-2.297 1.29 0 2.602.07 3.915-.14 1.195-.305 2.297-1.5 2.11-2.813-.118-.562-.75-.82-1.29-.82-2.156-.094-4.313 0-6.469-.048h-.023v.001z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M6.076 8.355h7.617l-1.007 2.602H5.044L6.076 8.38v-.023zm1.219 3.188h2.648L7.18 18.574H4.576l2.742-7.031h-.023z"
  }));
}
PAYX.DefaultColor = DefaultColor;
var PAYX_default = PAYX;
//# sourceMappingURL=PAYX.js.map
