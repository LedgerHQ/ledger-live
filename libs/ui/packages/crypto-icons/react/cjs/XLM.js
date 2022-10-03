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
  default: () => XLM_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function XLM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M17.348 6.969l-1.8.918-8.699 4.43a5.182 5.182 0 017.663-5.193l1.031-.525.154-.08a6.33 6.33 0 00-10.028 5.605 1.151 1.151 0 01-.626 1.113l-.544.277v1.293l1.6-.816.519-.264.51-.26 9.17-4.673 1.03-.524 2.13-1.086V5.892l-2.11 1.077zm2.111 1.509L7.651 14.49l-1.03.525L4.5 16.097v1.293l2.106-1.073 1.8-.918 8.708-4.437a5.182 5.182 0 01-7.671 5.198l-.064.033-1.118.57a6.33 6.33 0 0010.03-5.606 1.152 1.152 0 01.624-1.112l.544-.278V8.478z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M17.368 7.327l-1.8.918-8.698 4.43a5.182 5.182 0 017.663-5.193l1.03-.525.154-.08A6.33 6.33 0 005.69 12.483a1.151 1.151 0 01-.625 1.113l-.544.277v1.293l1.6-.816.519-.264.51-.26 9.17-4.673 1.03-.524 2.13-1.086V6.25l-2.11 1.077zm2.112 1.51L7.671 14.847l-1.03.525-2.12 1.082v1.293l2.106-1.073 1.8-.918 8.708-4.437a5.182 5.182 0 01-7.672 5.198l-.064.033-1.117.57a6.33 6.33 0 0010.029-5.606 1.152 1.152 0 01.625-1.112l.544-.278V8.837z"
  }));
}
XLM.DefaultColor = DefaultColor;
var XLM_default = XLM;
//# sourceMappingURL=XLM.js.map
