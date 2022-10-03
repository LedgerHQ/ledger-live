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
  default: () => SSV_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1BA5F8";
function SSV({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 512 512",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    opacity: 0.62,
    d: "M177.641 404.919l64.585-79.604c6.746-8.316 19.435-8.316 26.181 0l64.584 79.604a16.857 16.857 0 010 21.241l-64.584 79.604c-6.746 8.315-19.435 8.315-26.181 0l-64.585-79.604a16.86 16.86 0 010-21.241z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M242.226 6.236L177.641 85.84a16.86 16.86 0 000 21.242l64.585 79.604c6.746 8.315 19.435 8.315 26.181 0l64.584-79.604a16.858 16.858 0 000-21.242L268.407 6.236c-6.746-8.315-19.435-8.315-26.181 0zM76.766 210.257l64.585-79.604c6.746-8.315 19.435-8.315 26.181 0l64.584 79.604a16.857 16.857 0 010 21.241l-64.584 79.604c-6.746 8.315-19.435 8.315-26.181 0l-64.585-79.604a16.857 16.857 0 010-21.241zm201.813 0l64.584-79.604c6.747-8.315 19.435-8.315 26.181 0l64.585 79.604a16.857 16.857 0 010 21.241l-64.585 79.604c-6.746 8.315-19.434 8.315-26.181 0l-64.584-79.604a16.857 16.857 0 010-21.241z"
  }));
}
SSV.DefaultColor = DefaultColor;
var SSV_default = SSV;
//# sourceMappingURL=SSV.js.map
