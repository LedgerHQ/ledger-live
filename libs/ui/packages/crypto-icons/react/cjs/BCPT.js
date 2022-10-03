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
  default: () => BCPT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#404040";
function BCPT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5zm0-.826a7.424 7.424 0 10-.001-14.848A7.424 7.424 0 0012 19.424zM16.532 9.09c.124 2.204-1.912 2.786-1.912 2.786 2.327.332 2.203 2.328 2.203 2.328 0 3.241-3.617 3.368-3.617 3.368H8.134V6.429h4.573c3.825.167 3.825 2.661 3.825 2.661zm-5.78-.665v2.701h1.83s1.29-.041 1.372-1.08V9.38s0-.872-1.248-.955h-1.953zm3.45 6.112v-.666s0-.873-1.246-.957h-2.204v2.704h2.08s1.288-.041 1.371-1.082v.001z"
  }));
}
BCPT.DefaultColor = DefaultColor;
var BCPT_default = BCPT;
//# sourceMappingURL=BCPT.js.map
