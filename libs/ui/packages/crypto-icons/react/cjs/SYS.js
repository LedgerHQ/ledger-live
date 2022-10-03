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
  default: () => SYS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0082C6";
function SYS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M13.534 11.327a.087.087 0 00-.085.03.082.082 0 00.017.118c3.284 2.383-1.39 7.84-10.466 2.033 7.695 7.241 18.41-.757 10.534-2.18zM9.151 8.141c-6.814 2.18.993 7.322 1.67 4.725a.081.081 0 00-.009-.065.082.082 0 00-.053-.038.09.09 0 00-.048.001c-1.003.326-6.526-1.218-1.56-4.623zM21 9.451c-5.9-4.207-16.971-.738-11.26 2.233a.09.09 0 00.118-.035.082.082 0 00.002-.074C7.538 6.667 19.336 8.16 21 9.451zm-4.896 6.114c3.12-1.418.583-6.271-3.543-5.334a.087.087 0 01-.104-.064.08.08 0 01.03-.083c3.21-2.412 9.236 3.22 3.617 5.48z"
  }));
}
SYS.DefaultColor = DefaultColor;
var SYS_default = SYS;
//# sourceMappingURL=SYS.js.map
