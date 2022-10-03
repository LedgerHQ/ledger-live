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
  default: () => POLIS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2C3E50";
function POLIS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M19.238 18.004v-.75c0-.148-.1-.247-.251-.247h-.499v-.753c0-.15-.1-.25-.248-.25h-.5v-5.51h.497c.15 0 .251-.099.251-.25v-.75h.499a.242.242 0 00.248-.201c.026-.125-.024-.224-.123-.276l-6.989-3.504a.345.345 0 00-.223 0L4.66 9.017a.25.25 0 00-.124.273c0 .127.1.204.223.204h.75v.75c0 .148.1.247.249.247h.5v5.512H5.76c-.15 0-.252.1-.252.248v.753h-.498c-.15 0-.25.099-.25.248v.752c-.148 0-.25.1-.25.251 0 .152.1.25.248.25h14.48c.148 0 .25-.098.25-.247 0-.15-.1-.254-.248-.254h-.003zM6.006 9.993v-.5h11.98v.5H6.006zm10.232.502v5.508h-.996v-5.509h.996v.001zm-2.496 0v5.508h-.998v-5.509h.998v.001zm-2.496 0v5.508h-.996v-5.509h.996v.001zm-2.496 0v5.508h-.995v-5.509h.995v.001zm9.236 6.509H6.01v-.502h11.98v.502h-.003z"
  }));
}
POLIS.DefaultColor = DefaultColor;
var POLIS_default = POLIS;
//# sourceMappingURL=POLIS.js.map
