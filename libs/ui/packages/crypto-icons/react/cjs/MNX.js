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
  default: () => MNX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function MNX({
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
    d: "M11.147 20.24C6.99 19.803 3.75 16.28 3.75 12c0-4.281 3.24-7.804 7.397-8.24v2.528A5.775 5.775 0 006.252 12a5.775 5.775 0 004.895 5.712v2.527zm1.631-16.49c3.923.36 7.053 3.463 7.461 7.378h-2.522a5.775 5.775 0 00-4.938-4.856V3.75zm7.472 9.013c-.361 3.967-3.513 7.125-7.472 7.487v-2.522a5.775 5.775 0 004.955-4.965h2.517z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M11.147 20.24C6.99 19.803 3.75 16.28 3.75 12c0-4.281 3.24-7.804 7.397-8.24v2.528A5.775 5.775 0 006.252 12a5.775 5.775 0 004.895 5.712v2.527zm1.631-16.49c3.923.36 7.053 3.463 7.461 7.378h-2.522a5.775 5.775 0 00-4.938-4.856V3.75zm7.472 9.013c-.361 3.967-3.513 7.125-7.472 7.487v-2.522a5.775 5.775 0 004.955-4.965h2.517z"
  }));
}
MNX.DefaultColor = DefaultColor;
var MNX_default = MNX;
//# sourceMappingURL=MNX.js.map
