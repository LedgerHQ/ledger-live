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
  default: () => XAS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function XAS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M19.494 10.853l-7.102 8.258-.319.389-7.568-8.563.024-.01-.029-.005 2.941-4.918.002.002L7.441 6h9.191l-.002.005 2.87 4.847-.006.001zm-9.852.345l-1.627 2.755 4.013 4.584 4.023-4.621-1.592-2.727-4.817.008zm-2.083 2.234l1.32-2.234-3.272.005 1.952 2.23zm7.292-2.884l3.715-.006-2.332-3.906-3.662.008 2.279 3.904zm3.578.634l-3.205.006 1.285 2.201 1.92-2.207zm-4.343-.633l-2.018-3.458-2.048 3.465 4.066-.006zm-6.3-3.895l-2.324 3.91 3.795-.007 2.31-3.91-3.78.007z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19.494 10.103l-7.102 8.258-.319.389-7.568-8.563.024-.01-.029-.005 2.941-4.918.002.002-.002-.006h9.191l-.002.005 2.87 4.847-.006.001zm-9.852.345l-1.627 2.755 4.013 4.584 4.023-4.621-1.592-2.727-4.817.008zm-2.083 2.234l1.32-2.234-3.272.005 1.952 2.23zm7.292-2.884l3.715-.006-2.332-3.906-3.662.008 2.279 3.904zm3.578.634l-3.205.006 1.285 2.201 1.92-2.207zM14.086 9.8l-2.018-3.458-2.048 3.465 4.066-.006zm-6.3-3.895l-2.324 3.91 3.795-.007 2.31-3.91-3.78.007z"
  }));
}
XAS.DefaultColor = DefaultColor;
var XAS_default = XAS;
//# sourceMappingURL=XAS.js.map
