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
  default: () => CLOAK_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FF3A00";
function CLOAK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.002 3.75c4.55.007 8.25 3.71 8.248 8.252-.002 4.548-3.703 8.248-8.253 8.248h-.008c-4.545-.005-8.241-3.71-8.239-8.26.002-4.543 3.705-8.24 8.252-8.24zM12 4.814c-3.958 0-7.179 3.223-7.18 7.184-.001 3.958 3.216 7.18 7.171 7.182 3.962 0 7.189-3.221 7.192-7.181a7.127 7.127 0 00-2.104-5.078 7.134 7.134 0 00-5.078-2.107H12zm3.546 6.449c.254 1.289-.073 2.372-.999 3.313l-.128.128-.162-.08a4.773 4.773 0 00-.272-.123l-.367-.153.295-.265c.577-.518.884-1.194.913-2.008.03-.814-.259-1.525-.857-2.11a2.823 2.823 0 00-4.088.16 2.757 2.757 0 00-.66 2.402c.103.588.396 1.125.835 1.53l.29.27-.367.147a17.35 17.35 0 00-.29.12l-.157.066-.12-.122A3.5 3.5 0 018.39 12.3c-.148-1.834 1.041-3.45 2.828-3.84a3.598 3.598 0 014.327 2.804h.001zM7.48 15.98c-1.107-1.234-2.005-3.424-1.203-5.868a6.024 6.024 0 0111.423-.067c.71 2.079.216 4.443-1.256 6.022l-.188.2-.672-.751.148-.167c.921-1.037 1.349-2.268 1.271-3.655-.072-1.268-.576-2.372-1.498-3.28a4.954 4.954 0 00-3.5-1.432A5.024 5.024 0 008.726 8.2a4.941 4.941 0 00-1.507 2.278 4.964 4.964 0 00-.09 2.72c.187.768.555 1.48 1.073 2.077l.147.17-.687.74-.182-.205z"
  }));
}
CLOAK.DefaultColor = DefaultColor;
var CLOAK_default = CLOAK;
//# sourceMappingURL=CLOAK.js.map
