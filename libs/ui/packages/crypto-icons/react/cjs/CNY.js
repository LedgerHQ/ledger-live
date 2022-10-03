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
  default: () => CNY_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FF4314";
function CNY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M6.878 5.625H17.24v1.444H6.878V5.625zm-1.155 4.23h12.805v1.46h-3.922v4.88c0 .375.162.562.502.562h1.629c.178 0 .326-.115.414-.331.104-.231.178-.94.208-2.108l1.391.433c-.104 1.631-.296 2.599-.563 2.903-.266.288-.65.447-1.17.447h-2.352c-1.052 0-1.57-.534-1.57-1.589v-5.197h-2.19v.288c-.074 1.834-.488 3.306-1.243 4.404-.74 1.01-1.925 1.805-3.583 2.368l-.829-1.27c1.599-.55 2.665-1.242 3.227-2.051.563-.896.858-2.036.918-3.45v-.29H5.724V9.857z"
  }));
}
CNY.DefaultColor = DefaultColor;
var CNY_default = CNY;
//# sourceMappingURL=CNY.js.map
