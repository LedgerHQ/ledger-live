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
  default: () => DASH_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#008CE7";
function DASH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M14.323 5.92H8.866l-.452 2.526 4.922.008c2.423 0 3.142.88 3.12 2.34-.011.748-.338 2.014-.476 2.422-.372 1.095-1.14 2.342-4.019 2.338l-4.783-.003-.452 2.528h5.443c1.92 0 2.737-.224 3.6-.622 1.915-.884 3.056-2.776 3.514-5.246.68-3.675-.168-6.29-4.96-6.29z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.864 11.766c.177-.738.233-1.035.233-1.035H6.514c-1.428 0-1.632.93-1.768 1.493-.177.736-.234 1.036-.234 1.036h5.586c1.427 0 1.63-.93 1.767-1.494z"
  }));
}
DASH.DefaultColor = DefaultColor;
var DASH_default = DASH;
//# sourceMappingURL=DASH.js.map
