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
  default: () => OXT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#5F45BA";
function OXT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.61 6.821a.824.824 0 11-1.418-.841.824.824 0 011.418.841zm-2.813-.366a.583.583 0 11-1.002-.594.583.583 0 011.002.594zm7.83 11.925a6.41 6.41 0 004.815-9.548 6.412 6.412 0 00-6.41-3.176c-.538.05-1.067.183-1.566.393-.581.285-.956.76-.956 1.395 0 .825.669 1.496 1.495 1.496.138 0 .616-.152.73-.19a3.455 3.455 0 013.809 5.457 3.455 3.455 0 01-5.559-.29c-.69-.903-.53-2.348-.531-2.367a1.498 1.498 0 00-2.942-.338 2.998 2.998 0 00-.046.541 6.41 6.41 0 007.16 6.627zM7.753 9.109a1.068 1.068 0 11-1.835-1.091 1.068 1.068 0 011.834 1.09"
  }));
}
OXT.DefaultColor = DefaultColor;
var OXT_default = OXT;
//# sourceMappingURL=OXT.js.map
