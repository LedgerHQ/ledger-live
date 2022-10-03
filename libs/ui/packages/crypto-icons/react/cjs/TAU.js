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
  default: () => TAU_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#7B346E";
function TAU({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M6.07 10.258l1.583 1.583H4.5l1.57-1.582zm1.583 1.913l-1.582 1.57-1.571-1.57h3.153zm2.139-2.14l-1.582 1.57V8.45l1.582 1.582zm-1.912 1.57l-1.57-1.57L7.88 8.45v3.153zm2.14-1.809l-1.57-1.57h3.152l-1.582 1.57zm0-3.482l1.582 1.582H8.45l1.57-1.582zm3.722-.228l-1.583 1.57V4.5l1.582 1.582zm-1.913 1.57l-1.57-1.57 1.57-1.582v3.152zM9.792 13.98L8.21 15.55v-3.152l1.582 1.582zm-3.482 0l1.57-1.582v3.152l-1.57-1.57zm7.659-4.188l-1.57-1.57h3.152l-1.582 1.57zm-1.57-1.9l1.57-1.583 1.582 1.582h-3.153zm-.796 8.228l-1.583 1.57-1.57-1.57h3.152zm-1.583-1.913l1.582 1.583H8.45l1.57-1.583zm7.671-4.176l-1.582 1.57V8.45l1.582 1.582zm-3.482 0l1.57-1.582v3.153l-1.57-1.57zm-3.95 7.898l1.57-1.581V19.5l-1.57-1.571zm1.9-1.581l1.583 1.582-1.583 1.57v-3.152zm1.81 1.342l-1.57-1.57h3.152l-1.582 1.57zm0-3.482l1.583 1.582h-3.154l1.572-1.582zm2.14-1.81l1.583 1.583-1.583 1.57v-3.153zm-1.9 1.583l1.57-1.583v3.152l-1.57-1.57zm3.71-.24l-1.57-1.57H19.5l-1.581 1.57zm0-3.482L19.5 11.84h-3.152l1.571-1.582z"
  }));
}
TAU.DefaultColor = DefaultColor;
var TAU_default = TAU;
//# sourceMappingURL=TAU.js.map
