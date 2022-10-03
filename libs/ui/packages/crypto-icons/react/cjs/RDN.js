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
  default: () => RDN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2A2A2A";
function RDN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M7.125 4.504h6.083c.074-.022.111.045.16.083a11.164 11.164 0 011.534 1.792c.634.91 1.133 1.907 1.479 2.96a9.995 9.995 0 01.487 3.46h-3.101a3.73 3.73 0 00.016-.467c-.032-1.104-.372-2.186-.909-3.145-.573-1.026-1.374-1.912-2.285-2.648-.991-.802-2.107-1.435-3.27-1.946-.064-.03-.132-.054-.194-.089zM9.376 10c1.04 1.882 2.08 3.765 3.117 5.65.25.454.502.907.75 1.362-1.291.827-2.578 1.66-3.868 2.488V10h.001z"
  }));
}
RDN.DefaultColor = DefaultColor;
var RDN_default = RDN;
//# sourceMappingURL=RDN.js.map
