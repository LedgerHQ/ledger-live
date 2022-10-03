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
  default: () => DTA_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#74D269";
function DTA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.347 10.884h.015l.013 3.724L9.992 19.5l-2.244-1.262v.002l-.014-.009-2.109-1.352V7.113l2.305-1.36.004.002L9.97 4.5l8.362 4.922.016 1.462zm-2.456 2.334l-1.754-1.004-5.856 3.445 1.72 1.022 5.89-3.463zm-2.15-1.23L10.13 9.919l-.016 4.261 3.627-2.192zm-3.61-2.524l5.806 3.398v-2.029L10.14 7.447l-.008 2.016zM7.74 17.676l.022-2.034-.013.008V8.472l-1.76-1.05v9.21l1.751 1.045zm.312-2.25l1.759-1.064V7.422l-1.759 1.05v6.955zm2.16 1.523l-.034 2.127 7.826-4.602.023-2.115-7.814 4.59zm5.846-6.438l1.821-1.04-7.841-4.578-1.805 1.044 7.825 4.574z"
  }));
}
DTA.DefaultColor = DefaultColor;
var DTA_default = DTA;
//# sourceMappingURL=DTA.js.map
