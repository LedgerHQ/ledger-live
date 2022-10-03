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
  default: () => MONA_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#DEC799";
function MONA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M17.65 10.061l-1.069-4.81-2.098 3.31a10.572 10.572 0 00-4.962 0l-2.092-3.31-1.073 4.81c-1.151.921-1.854 2.125-1.854 3.447 0 2.895 3.357 5.241 7.498 5.241 4.14 0 7.498-2.347 7.498-5.241-.001-1.322-.698-2.526-1.849-3.447zm-9.816 2.202h-.5l1.22-1.407h.889l-1.61 1.407zm4.128 3.438l-2.075-3.654.512-.292.463.813h2.266l.483-.817.507.302-2.156 3.648zm4.21-3.438l-1.61-1.407h.894l1.219 1.407h-.503zm-4.2 2.261l-.775-1.364h1.58l-.805 1.364z"
  }));
}
MONA.DefaultColor = DefaultColor;
var MONA_default = MONA;
//# sourceMappingURL=MONA.js.map
