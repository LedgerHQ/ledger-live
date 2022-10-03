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
  default: () => BCN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F04086";
function BCN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.044 12.73c-.472-.522-1.152-.846-2.04-.972v-.019c.778-.126 1.39-.444 1.805-.954.421-.506.65-1.145.646-1.803 0-1.096-.352-1.84-1.083-2.427-.73-.585-1.827-.777-3.313-.777H8.45V11H5.227v2h8.795c.692 0 1.212.049 1.555.326.344.276.52.634.52 1.163s-.174.98-.52 1.264c-.345.282-.865.47-1.555.47h-3.018v-1.556H8.449v3.555h5.795c1.474 0 2.6-.384 3.382-.982.78-.598 1.147-1.48 1.147-2.564a2.858 2.858 0 00-.729-1.946zM13.7 10.995h-2.695V7.773h2.695c1.386 0 2.078.54 2.078 1.61s-.692 1.612-2.078 1.612z"
  }));
}
BCN.DefaultColor = DefaultColor;
var BCN_default = BCN;
//# sourceMappingURL=BCN.js.map
