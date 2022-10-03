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
  default: () => QIWI_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FF8C00";
function QIWI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M16.567 14.584c.039.3-.047.417-.142.417-.095 0-.229-.117-.371-.349-.143-.232-.2-.495-.124-.63.047-.088.152-.127.276-.078.247.097.343.475.361.64zm-1.332.66c.295.252.38.542.228.756a.496.496 0 01-.39.174.671.671 0 01-.448-.165c-.266-.233-.343-.62-.172-.834a.367.367 0 01.306-.135c.152 0 .323.067.476.203zM4.875 11.17c0-3.685 2.933-6.671 6.55-6.671 3.62 0 6.552 2.987 6.552 6.67a6.805 6.805 0 01-.924 3.424c-.019.029-.067.019-.076-.02-.228-1.639-1.209-2.54-2.637-2.812-.124-.02-.143-.097.019-.116.438-.039 1.056-.03 1.38.03.02-.171.03-.343.029-.515 0-2.434-1.943-4.412-4.333-4.412s-4.332 1.978-4.332 4.412 1.943 4.412 4.332 4.412h.2a6.061 6.061 0 01-.086-1.193c.01-.271.068-.31.182-.097.6 1.058 1.456 2.008 3.133 2.385 1.37.311 2.741.67 4.217 2.58.133.165-.066.339-.218.203-1.505-1.357-2.876-1.803-4.123-1.803-1.4.01-2.352.195-3.315.195-3.618 0-6.55-2.989-6.55-6.673z"
  }));
}
QIWI.DefaultColor = DefaultColor;
var QIWI_default = QIWI;
//# sourceMappingURL=QIWI.js.map
