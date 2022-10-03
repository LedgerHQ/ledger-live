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
  default: () => EOP_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FEFFFE";
function EOP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.036 21L7.025 10.303l-1.62 7.38L11.035 21zM12.09 3.128l-4.397 5.35 4.397 11.237 4.423-11.238-4.423-5.349zM13.17 21l4.012-10.697 1.594 7.38L13.17 21z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M10.945 20.936l-4.01-10.697-1.62 7.38 5.63 3.317zM12 3.064l-4.397 5.35L12 19.65l4.423-11.237L12 3.064zm1.08 17.872l4.012-10.697 1.594 7.38-5.606 3.317z"
  }));
}
EOP.DefaultColor = DefaultColor;
var EOP_default = EOP;
//# sourceMappingURL=EOP.js.map
