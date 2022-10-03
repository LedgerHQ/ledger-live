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
  default: () => BOS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00A8D6";
function BOS({
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
    d: "M10.449 14.213v-1.438h2.216c1.477 0 2.216-.37 2.216-1.107V7.795c0-.737-.739-1.106-2.216-1.106H9.12v2.323H7.125V5.25h5.318c2.955 0 4.432.811 4.432 2.434v4.095c0 1.623-1.477 2.434-4.432 2.434h-1.994zm4.432.885h1.994v1.217c0 1.623-1.477 2.435-4.432 2.435H7.125v-8.631h5.318c.312 0 .607.009.887.027v1.44a6.843 6.843 0 00-.665-.03H9.12v5.755h3.545c1.478 0 2.217-.369 2.217-1.106v-1.107h-.001z"
  }));
}
BOS.DefaultColor = DefaultColor;
var BOS_default = BOS;
//# sourceMappingURL=BOS.js.map
