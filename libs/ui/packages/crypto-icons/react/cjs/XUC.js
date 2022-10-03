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
  default: () => XUC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function XUC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0zm-2.828.26c.006-.094 0 0 0-.096 0-2.705-1.998-5.108-4.591-5.512V5.077l-1.68.523v1.053a5.412 5.412 0 00-4.577 5.343 5.416 5.416 0 004.758 5.374v1.551l1.68-.523v-1.085a5.422 5.422 0 004.081-3.51h-1.74a3.81 3.81 0 01-5.96.99 3.82 3.82 0 01-1.208-2.52l9.238-.014zm-8.985-1.662a3.82 3.82 0 017.108 0H8.438z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0zm-2.828.26c.006-.094 0 0 0-.096 0-2.705-1.998-5.108-4.591-5.512V5.077l-1.68.523v1.053a5.412 5.412 0 00-4.577 5.343 5.416 5.416 0 004.758 5.374v1.551l1.68-.523v-1.085a5.422 5.422 0 004.081-3.51h-1.74a3.81 3.81 0 01-5.96.99 3.82 3.82 0 01-1.208-2.52l9.238-.014zm-8.985-1.662a3.82 3.82 0 017.108 0H8.438z"
  }));
}
XUC.DefaultColor = DefaultColor;
var XUC_default = XUC;
//# sourceMappingURL=XUC.js.map
