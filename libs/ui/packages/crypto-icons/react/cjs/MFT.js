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
  default: () => MFT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#DA1157";
function MFT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M15.752 14.27a2.27 2.27 0 100-4.54 2.27 2.27 0 000 4.54zm0-7.505a5.235 5.235 0 11-3.753 8.883A5.216 5.216 0 0013.482 12a5.216 5.216 0 00-1.483-3.648 5.218 5.218 0 013.752-1.587zM8.248 14.27a2.27 2.27 0 100-4.539 2.27 2.27 0 000 4.54zM12 8.352A5.216 5.216 0 0010.518 12c0 1.419.566 2.705 1.482 3.648a5.234 5.234 0 110-7.296zM10.517 12c0 1.42.566 2.706 1.483 3.648A5.216 5.216 0 0013.482 12 5.216 5.216 0 0012 8.352 5.215 5.215 0 0010.517 12z"
  }));
}
MFT.DefaultColor = DefaultColor;
var MFT_default = MFT;
//# sourceMappingURL=MFT.js.map
