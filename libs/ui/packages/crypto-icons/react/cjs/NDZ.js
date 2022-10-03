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
  default: () => NDZ_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#622FBA";
function NDZ({
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
    d: "M13.94 13.032c-.066.02-.129.045-.19.073l-2.757-2.865a1.433 1.433 0 00-.855-2.096V6.14L9.4 5.727l1.704-.986a1.788 1.788 0 011.792 0l3.389 1.962-1.34.774a1.433 1.433 0 10-1.005 2.679v2.876zm.853 0v-2.877a1.431 1.431 0 00.819-2.08l1.522-.88.728.42a1.78 1.78 0 01.888 1.54v5.69c0 .634-.338 1.22-.889 1.54l-3.067 1.775v-2.394a1.432 1.432 0 00-.001-2.734zm-1.67.652a1.433 1.433 0 00.817 2.082v2.889l-1.044.604a1.79 1.79 0 01-1.792 0l-3.649-2.112 1.371-1.07a1.433 1.433 0 001.472.226 1.433 1.433 0 00-.161-2.703v-2.698c.079-.022.155-.05.228-.085l2.758 2.867zm-3.839-.06a1.433 1.433 0 00-.92 1.731l-1.703 1.332-.522-.302a1.78 1.78 0 01-.889-1.54v-5.69c0-.634.338-1.22.889-1.54l2.404-1.392.742.415v1.53a1.432 1.432 0 000 2.71v2.746zm.466-3.482a.62.62 0 11-.045-1.238.62.62 0 01.045 1.238zm0 5.456a.621.621 0 11-.045-1.241.621.621 0 01.045 1.241zm4.616-6.19a.62.62 0 11-.044-1.241.62.62 0 01.044 1.24zm0 5.61a.62.62 0 11-.001-1.24.62.62 0 01.001 1.24z"
  }));
}
NDZ.DefaultColor = DefaultColor;
var NDZ_default = NDZ;
//# sourceMappingURL=NDZ.js.map
