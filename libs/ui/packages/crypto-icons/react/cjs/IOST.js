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
  default: () => IOST_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1C1C1C";
function IOST({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.375 8.25v7.5L12 19.5l-6.375-3.75v-7.5L12 4.5l6.375 3.75zm-6.576 4.055l-.592.35 1.106.647.59-.347 1.573.926-2.348 1.38-4.871-2.84-.02 1.383 4.894 2.842 4.703-2.765-2.756-1.622.555-.327-1.107-.647-.551.326-.772-.455.675-.4-1.107-.647-.673.398-1.315-.774 2.348-1.381 3.245 1.897 1.19-.704-4.438-2.578-4.702 2.766 2.496 1.469-.47.277 1.107.648.467-.276.773.454z"
  }));
}
IOST.DefaultColor = DefaultColor;
var IOST_default = IOST;
//# sourceMappingURL=IOST.js.map
