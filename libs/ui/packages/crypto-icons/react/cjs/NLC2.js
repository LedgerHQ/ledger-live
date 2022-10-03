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
  default: () => NLC2_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F28F01";
function NLC2({
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
    d: "M13.613 10.29l-1.455-2.863c.303-.66.454-1.035.454-1.121 0-.31-.204-.536-.611-.681h4.46c-.549.247-1.038.866-1.465 1.857l-1.383 2.807zm-2.187 4.445l-.678 1.38h4.002c1.813 0 3.025-.34 3.636-1.02l-2.139 3.28H5.31c1.18-.227 2.372-1.65 3.574-4.27.405-.806.776-1.55 1.115-2.231l1.428 2.861zm-7.676.453c.886-.526 4.125-6.13 4.125-7.706 0-.371-.224-.722-.672-1.052h3.483l3.025 5.941 2.934-5.941h3.605c-1.528.402-4.553 7.61-4.553 8.448 0 .165.03.268.092.31h-3.178L9.891 9.74l-2.688 5.447H3.75z"
  }));
}
NLC2.DefaultColor = DefaultColor;
var NLC2_default = NLC2;
//# sourceMappingURL=NLC2.js.map
