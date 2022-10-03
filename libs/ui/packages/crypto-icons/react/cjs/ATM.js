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
  default: () => ATM_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#346FCE";
function ATM({
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
    d: "M15.193 14.206l.717 1.348a3.277 3.277 0 01-1.355 4.431l-.093.05a3.277 3.277 0 01-4.432-1.355l-2.417-4.546a3.277 3.277 0 011.194-4.34L8.09 8.445a3.277 3.277 0 011.355-4.431l.093-.05A3.277 3.277 0 0113.97 5.32l2.418 4.546a3.277 3.277 0 01-1.194 4.34zm0 0l-1.7-3.198A3.277 3.277 0 009.06 9.653l-.093.049c-.054.03-.108.06-.16.091l1.7 3.2a3.277 3.277 0 004.431 1.354l.093-.05.161-.09z"
  }));
}
ATM.DefaultColor = DefaultColor;
var ATM_default = ATM;
//# sourceMappingURL=ATM.js.map
