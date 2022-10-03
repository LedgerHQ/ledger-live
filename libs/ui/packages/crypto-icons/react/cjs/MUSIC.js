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
  default: () => MUSIC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FBBF02";
function MUSIC({
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
    d: "M12.001 24c-1.17 0-2.334-.172-3.454-.51 2.254-.399 3.915-1.72 3.915-3.284 0-.182 2.679-14.618 2.679-14.618s4.072.618 5.478 4.848c0 0 1.818-2.448-.254-7.03A11.956 11.956 0 0124 11.767C23.875 5.248 18.55 0 12 0a12 12 0 011.988.17l-3.042 17.673C9.965 17.2 8.595 16.8 7.08 16.8c-2.206 0-4.109.836-4.934 2.048A12.02 12.02 0 01.001 12c0 6.627 5.373 12 12 12z"
  }));
}
MUSIC.DefaultColor = DefaultColor;
var MUSIC_default = MUSIC;
//# sourceMappingURL=MUSIC.js.map
