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
  default: () => SBERBANK_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#48B254";
function SBERBANK({
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
    d: "M17.01 5.151l.71.644-8.95 5.108L4.44 8.41l.404-.805 3.928 2.233 8.24-4.688v.001zm-1.8-1.026l.95.483-7.39 4.224L5.33 6.88l.586-.703L8.77 7.806l6.44-3.681zm3.137 2.333l.526.704L8.77 12.935 3.893 10.16l.222-.885 4.657 2.656 9.576-5.472zm1.457 2.595c.298.832.446 1.703.446 2.615 0 .912-.148 1.798-.445 2.655l-.203.543a8.357 8.357 0 01-1.761 2.615 8.138 8.138 0 01-2.633 1.73 8.134 8.134 0 01-6.438 0 8.505 8.505 0 01-2.611-1.73 7.926 7.926 0 01-1.761-2.615 8.21 8.21 0 01-.648-3.198v-.543l5.02 2.836L19.36 7.927l.445 1.126z"
  }));
}
SBERBANK.DefaultColor = DefaultColor;
var SBERBANK_default = SBERBANK;
//# sourceMappingURL=SBERBANK.js.map
