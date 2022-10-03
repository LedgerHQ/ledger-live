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
  default: () => REPV2_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0E0E21";
function REPV2({
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
    d: "M8.662 11.434l-.93-.604a.188.188 0 01-.059-.253l3.588-6.083a.368.368 0 01.315-.181h.847a.368.368 0 01.315.181l3.588 6.083a.187.187 0 01-.06.253l-.93.604a.183.183 0 01-.255-.062l-3.002-5.09a.092.092 0 00-.158 0l-3.002 5.09a.182.182 0 01-.257.062zm8.608.746l1.428 2.421a.378.378 0 01-.116.505l-6.383 4.148a.363.363 0 01-.397 0l-6.383-4.148a.375.375 0 01-.117-.505L6.73 12.18a.182.182 0 01.257-.062l.93.604a.188.188 0 01.058.253l-.816 1.384a.095.095 0 00.03.126l4.761 3.093c.03.02.068.02.099 0l4.762-3.093a.094.094 0 00.03-.126l-.816-1.384a.188.188 0 01.06-.253l.93-.604a.181.181 0 01.255.062z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M8.663 11.62l-.93-.603a.187.187 0 01-.06-.253l3.588-6.083a.368.368 0 01.315-.181h.847a.368.368 0 01.315.181l3.588 6.083a.187.187 0 01-.06.253l-.93.604a.183.183 0 01-.255-.062l-3.002-5.09a.092.092 0 00-.158 0L8.92 11.56a.182.182 0 01-.256.062zm8.607.747l1.428 2.421a.378.378 0 01-.116.506l-6.383 4.147a.362.362 0 01-.397 0L5.42 15.294a.375.375 0 01-.117-.506l1.428-2.42a.182.182 0 01.256-.062l.93.603a.187.187 0 01.059.253l-.816 1.384a.095.095 0 00.03.126l4.76 3.094c.03.02.068.02.099 0l4.762-3.094a.094.094 0 00.03-.126l-.816-1.384a.188.188 0 01.06-.253l.93-.603a.184.184 0 01.207.007c.02.014.036.033.048.054z"
  }));
}
REPV2.DefaultColor = DefaultColor;
var REPV2_default = REPV2;
//# sourceMappingURL=REPV2.js.map
