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
  default: () => EQZ_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#3A4AFF";
function EQZ({
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
    d: "M12 21a9 9 0 110-18 9 9 0 010 18zM7.14 9.038c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957c0-.528-2.174-.957-4.856-.957s-4.856.429-4.856.957zm4.856 3.873c-2.682 0-4.856-.428-4.856-.957 0-.528 2.174-.957 4.856-.957s4.856.429 4.856.957c0 .529-2.174.957-4.856.957zm-4.856 2.052c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957c0-.528-2.174-.957-4.856-.957s-4.856.429-4.856.957z"
  }));
}
EQZ.DefaultColor = DefaultColor;
var EQZ_default = EQZ;
//# sourceMappingURL=EQZ.js.map
