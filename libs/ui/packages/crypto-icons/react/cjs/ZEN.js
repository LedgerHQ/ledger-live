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
  default: () => ZEN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00EAAB";
function ZEN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.657 7.226l-1.335 2.078c.425.835.646 1.759.642 2.696 0 3.3-2.67 5.957-5.958 5.957a5.817 5.817 0 01-2.682-.642l-2.091 1.348a8.198 8.198 0 004.76 1.537 8.2 8.2 0 008.2-8.2 8.118 8.118 0 00-1.536-4.774z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12.006 16.093a4.112 4.112 0 004.043-3.363 9.355 9.355 0 00-7.457 1.55 4.094 4.094 0 003.414 1.813z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14.022 11.773c.717 0 1.41.075 2.09.227a4.12 4.12 0 00-4.118-4.119 4.11 4.11 0 00-4.068 4.672c-1.033.795-1.524 1.412-1.55 1.437a5.953 5.953 0 015.617-7.935c.97 0 1.877.226 2.683.642l2.079-1.347a7.993 7.993 0 00-4.749-1.55 8.192 8.192 0 00-8.2 8.2c0 1.826.593 3.502 1.6 4.861a9.672 9.672 0 011.398-1.927s.807-.843 1.424-1.271a9.78 9.78 0 015.794-1.89z"
  }));
}
ZEN.DefaultColor = DefaultColor;
var ZEN_default = ZEN;
//# sourceMappingURL=ZEN.js.map
