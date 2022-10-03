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
  default: () => QSP_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#454545";
function QSP({
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
    d: "M8.625 12A3.38 3.38 0 0112 8.625 3.38 3.38 0 0115.375 12c0 .49-.107.954-.296 1.375l-2.227-2.228-1.704 1.705 2.228 2.227a3.352 3.352 0 01-1.376.296A3.379 3.379 0 018.625 12zm8.86 0a5.454 5.454 0 00-.885-2.983l2.15-2.151-1.616-1.616-2.15 2.151A5.454 5.454 0 0012 6.515a5.46 5.46 0 00-2.983.885L6.866 5.25 5.25 6.865l2.151 2.152a5.46 5.46 0 000 5.967l-2.151 2.15 1.615 1.616 2.152-2.151c.859.559 1.882.886 2.983.886a5.453 5.453 0 002.983-.886l2.151 2.151 1.616-1.616-2.151-2.15A5.454 5.454 0 0017.485 12z"
  }));
}
QSP.DefaultColor = DefaultColor;
var QSP_default = QSP;
//# sourceMappingURL=QSP.js.map
