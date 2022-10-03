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
  default: () => DEW_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FEC907";
function DEW({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M7.996 17.112a.83.83 0 01.84.819.83.83 0 01-.84.819h-1.09a.917.917 0 01-.64-.259.873.873 0 01-.266-.625V6.112c0-.229.093-.448.259-.61a.894.894 0 01.624-.252h1.168a.83.83 0 01.84.819.81.81 0 01-.246.579.853.853 0 01-.594.24h-.258v10.224h.203zm9.127-8.589c.584 1.004.877 2.126.877 3.368s-.296 2.365-.887 3.37c-.59 1.004-1.246 1.773-2.324 2.47-.99.64-2.023 1.018-3.305 1.018h-.425a.83.83 0 01-.84-.819.83.83 0 01.84-.818h.517c.908 0 1.567-.376 2.307-.802.74-.426 1.214-1.125 1.643-1.878.43-.752.645-1.593.645-2.521-.001-.941-.218-1.788-.654-2.541a4.778 4.778 0 00-1.782-1.78c-.753-.432-1.59-.649-2.51-.649h-.223a.83.83 0 01-.84-.818c0-.218.089-.426.246-.579a.849.849 0 01.594-.24h.261c1.27 0 2.417.285 3.443.856a6.276 6.276 0 012.417 2.363z"
  }));
}
DEW.DefaultColor = DefaultColor;
var DEW_default = DEW;
//# sourceMappingURL=DEW.js.map
