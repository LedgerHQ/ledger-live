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
  default: () => OKB_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2D60E0";
function OKB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    opacity: 0.15,
    d: "M12 11.245A3.623 3.623 0 1012 4a3.623 3.623 0 000 7.245z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.4,
    d: "M16.378 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.6,
    d: "M12 20a3.623 3.623 0 100-7.245A3.623 3.623 0 0012 20z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.85,
    d: "M7.623 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246z"
  }));
}
OKB.DefaultColor = DefaultColor;
var OKB_default = OKB;
//# sourceMappingURL=OKB.js.map
