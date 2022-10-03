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
  default: () => XBY_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#56F4F1";
function XBY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M4.5 5.637c0-.011.157-.012 2.189-.01l2.189.002 1.245 2.095 1.266 2.13.02.036.199-.338c.108-.186.196-.341.195-.346l-1.058-1.785a232.64 232.64 0 01-1.054-1.785c0-.01.329-.011 2.304-.011 1.28 0 2.305.003 2.305.008 0 .014-4.887 8.322-4.898 8.325-.008.001-.723-1.207-2.457-4.153A881.191 881.191 0 014.5 5.637zm10.605-.007c0-.003.99-.005 2.198-.005H19.5l-.003.016c-.002.01-1.097 1.876-2.433 4.147-1.62 2.75-2.434 4.13-2.445 4.131-.01.002-.24-.38-1.009-1.675l-1.002-1.682c-.007-.003-.4.665-.397.674 0 .003.453.765 1.003 1.692.339.563.671 1.129.998 1.698-.007.027-2.202 3.747-2.211 3.749-.014.003-2.197-3.705-2.192-3.724.003-.008 5.215-8.887 5.295-9.02h.001z"
  }));
}
XBY.DefaultColor = DefaultColor;
var XBY_default = XBY;
//# sourceMappingURL=XBY.js.map
