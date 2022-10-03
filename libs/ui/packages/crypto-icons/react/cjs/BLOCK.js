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
  default: () => BLOCK_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#101341";
function BLOCK({
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
    d: "M8.266 5.25h7.671L19.875 12l-3.938 6.75H8.198l3.87-6.75-3.802-6.75zm4.073 2.375L14.852 12l-2.512 4.375h2.24L17.093 12l-2.513-4.375h-2.24z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.5,
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M9.085 8.27L6.908 12l2.157 3.697-1.379 2.407L4.125 12l3.592-6.158L9.085 8.27z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M8.266 5.25h7.671L19.875 12l-3.938 6.75H8.198l3.87-6.75-3.802-6.75zm4.073 2.375L14.852 12l-2.512 4.375h2.24L17.093 12l-2.513-4.375h-2.24z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.5,
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M9.085 8.27L6.908 12l2.157 3.697-1.379 2.407L4.125 12l3.592-6.158L9.085 8.27z"
  }));
}
BLOCK.DefaultColor = DefaultColor;
var BLOCK_default = BLOCK;
//# sourceMappingURL=BLOCK.js.map
