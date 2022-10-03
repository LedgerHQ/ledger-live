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
  default: () => ADD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FEC807";
function ADD({
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
    d: "M18.08 13.844h-3.696l-.66-1.98h4.35a.561.561 0 000-1.122h-4.707l-1.888-5.755a.805.805 0 00-1.59-.052L5.374 18.662a.708.708 0 000 .225.759.759 0 001.492.184l3.788-11.55 1.082 3.22H10.8a.561.561 0 000 1.123h1.32l.66 1.98h-1.98a.56.56 0 000 1.122h2.37l1.069 3.168h-5.67a.792.792 0 000 1.584h6.706a.752.752 0 00.752-.752.773.773 0 00-.072-.33l-1.208-3.67h3.3a.561.561 0 100-1.122h.033z"
  }));
}
ADD.DefaultColor = DefaultColor;
var ADD_default = ADD;
//# sourceMappingURL=ADD.js.map
