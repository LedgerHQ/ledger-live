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
  default: () => DAI_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F4B731";
function DAI({
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
    d: "M6.583 6h4.914c2.989 0 5.254 1.587 6.097 3.896h1.531v1.395h-1.208c.023.22.035.446.035.674v.034c0 .257-.015.51-.045.758h1.218v1.395h-1.56C16.7 16.429 14.452 18 11.497 18H6.584v-3.848H4.875v-1.395h1.708V11.29H4.875V9.896h1.708V6zm1.373 8.152v2.596h3.54c2.185 0 3.809-1.04 4.564-2.596H7.956zm8.524-1.395H7.957V11.29h8.527c.031.23.048.467.048.708v.034a5.2 5.2 0 01-.05.723zm-4.982-5.508c2.194 0 3.822 1.068 4.573 2.646H7.956V7.25h3.54l.002-.001z"
  }));
}
DAI.DefaultColor = DefaultColor;
var DAI_default = DAI;
//# sourceMappingURL=DAI.js.map
