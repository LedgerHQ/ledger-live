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
  default: () => ETC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0B8311";
function ETC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12 12.432L6.96 12 12 9.148v3.284zm0 3.345v5.205c-1.752-2.728-3.684-5.731-5.241-8.162 1.837 1.035 3.756 2.117 5.241 2.958zm0-7.55L6.76 11.15 12 3.018v5.208zM17.041 12l-5.04.432V9.148L17.04 12zm-5.04 3.778c1.485-.84 3.402-1.923 5.24-2.958-1.556 2.432-3.489 5.435-5.24 8.162v-5.204zm0-7.552V3.018l5.24 8.133-5.24-2.925z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.2,
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 12.432L17.04 12 12 14.83v-2.398z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.603,
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 12.432L6.959 12l5.04 2.83v-2.398z"
  }));
}
ETC.DefaultColor = DefaultColor;
var ETC_default = ETC;
//# sourceMappingURL=ETC.js.map
