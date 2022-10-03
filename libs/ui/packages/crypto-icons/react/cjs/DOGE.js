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
  default: () => DOGE_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#C3A634";
function DOGE({
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
    d: "M9.56 10.957h3.236v1.715H9.561v3.613h2.04c.808 0 1.47-.108 1.984-.327.514-.219.918-.52 1.21-.908a3.3 3.3 0 00.598-1.361A8.556 8.556 0 0015.55 12a8.556 8.556 0 00-.157-1.689 3.297 3.297 0 00-.597-1.361c-.293-.387-.698-.69-1.211-.908-.515-.219-1.176-.327-1.983-.327H9.56v3.243zm-2.074 1.715H6.375v-1.714h1.111V6h4.912c.908 0 1.693.157 2.357.47a4.392 4.392 0 011.626 1.287c.42.543.732 1.178.937 1.907.205.728.307 1.507.307 2.336a8.604 8.604 0 01-.308 2.336 5.506 5.506 0 01-.937 1.908c-.42.543-.962.971-1.625 1.286-.664.313-1.45.47-2.357.47H7.486v-5.328z"
  }));
}
DOGE.DefaultColor = DefaultColor;
var DOGE_default = DOGE;
//# sourceMappingURL=DOGE.js.map
