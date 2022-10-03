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
  default: () => DTR_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#121747";
function DTR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M13.535 17.159c0 .858-.69 1.555-1.542 1.555a1.548 1.548 0 01-1.541-1.556V6.816c0-.859.69-1.555 1.541-1.555a1.55 1.55 0 011.542 1.556v10.342zm-5.19.003a1.554 1.554 0 01-.761 1.365 1.524 1.524 0 01-1.551 0 1.554 1.554 0 01-.76-1.365v-2.325a1.554 1.554 0 01.76-1.365 1.523 1.523 0 011.55 0 1.554 1.554 0 01.761 1.365l.001 2.325z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.5,
    d: "M18.728 13.056c0 .859-.69 1.556-1.542 1.556a1.55 1.55 0 01-1.542-1.557V9.131c0-.86.69-1.557 1.542-1.557.852 0 1.542.697 1.542 1.557v3.925z"
  }));
}
DTR.DefaultColor = DefaultColor;
var DTR_default = DTR;
//# sourceMappingURL=DTR.js.map
