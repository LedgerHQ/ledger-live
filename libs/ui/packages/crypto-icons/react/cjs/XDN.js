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
  default: () => XDN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#4F7AA2";
function XDN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M9.982 9h2.053c.992 0 2.762.602 2.762 3s-1.77 3-2.762 3H9.982V9zm1.132 4.785h.85c.709 0 1.559-.434 1.559-1.785s-.85-1.785-1.558-1.785h-.85v3.57zM15.577 9h.425l3.824 5.27V9h.424v6h-.425L16 9.846V15h-.425l.002-6zM3.75 9h1.416v1.5H3.75V9zm2.125 0H7.29v1.5H5.875V9zm2.124 0h1.417v1.5H7.998V9zm0 2.25h1.417v1.5H7.998v-1.5zm0 2.25h1.417V15H7.998v-1.5zm-2.124-2.25H7.29v1.5H5.875v-1.5z"
  }));
}
XDN.DefaultColor = DefaultColor;
var XDN_default = XDN;
//# sourceMappingURL=XDN.js.map
