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
  default: () => VERI_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F93";
function VERI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M4.5 6c.828.002 1.657.002 2.484 0l1.568 8.385c.025.124.055.246.087.368.123-.488.2-.986.303-1.478L10.37 6h2.403c-.881 3.925-1.762 7.85-2.645 11.774H7.145L4.5 6.008V6zm9.236 3.7c.522-.658 1.358-.956 2.163-1.008.795-.056 1.652.016 2.325.49.596.417.924 1.122 1.079 1.824.188.879.198 1.782.197 2.677h-4.402c.003.662-.038 1.346.183 1.98.107.312.308.623.626.736.339.11.747.038.994-.235.33-.373.4-.897.471-1.376h1.998c-.045.795-.192 1.635-.712 2.26-.522.65-1.364.915-2.16.947-.866.033-1.806-.085-2.496-.668-.64-.534-.92-1.382-1.032-2.194a16.333 16.333 0 01-.065-2.822c.07-.916.236-1.887.83-2.613V9.7zm1.705.933c-.34.49-.35 1.122-.344 1.7h2.275c-.036-.55-.032-1.13-.28-1.633-.307-.621-1.279-.624-1.65-.066h-.001v-.001z"
  }));
}
VERI.DefaultColor = DefaultColor;
var VERI_default = VERI;
//# sourceMappingURL=VERI.js.map
