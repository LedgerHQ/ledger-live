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
  default: () => RISE_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F49352";
function RISE({
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
    d: "M9.454 6.866c-.643 0-1.164-.53-1.164-1.182 0-.654.521-1.184 1.164-1.184.643 0 1.164.53 1.164 1.184 0 .654-.52 1.182-1.164 1.182zM14.585 19.5a1.174 1.174 0 01-1.164-1.183c0-.653.522-1.183 1.164-1.183.644 0 1.165.53 1.165 1.183 0 .654-.521 1.183-1.165 1.183zm-4.653-8.842a1.035 1.035 0 01-1.467-.2A1.074 1.074 0 018.66 8.97l5.369-4.171a1.035 1.035 0 011.466.199 1.074 1.074 0 01-.195 1.49l-5.368 4.17zm.04 4.251a1.036 1.036 0 01-1.467-.199 1.074 1.074 0 01.195-1.49l5.369-4.17a1.035 1.035 0 011.466.198 1.074 1.074 0 01-.195 1.49L9.97 14.909zm0 4.372a1.035 1.035 0 01-1.467-.199 1.074 1.074 0 01.195-1.49l5.369-4.17a1.035 1.035 0 011.466.198 1.074 1.074 0 01-.195 1.49L9.97 19.28z"
  }));
}
RISE.DefaultColor = DefaultColor;
var RISE_default = RISE;
//# sourceMappingURL=RISE.js.map
