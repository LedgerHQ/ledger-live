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
  default: () => X_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#3B5998";
function X({
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
    d: "M10.59 4.717H12V9.13l-1.41-1.473V4.717z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M4.51 6.204h3.713c1.257 1.317 2.52 2.63 3.778 3.95.728-.757 1.454-1.519 2.18-2.278.536-.556 1.07-1.114 1.605-1.672h3.702C17.76 7.95 16.035 9.7 14.306 11.446c-.182.182-.364.366-.542.55.044.047.09.093.13.142l5.078 5.135.518.522h-2.873c-.074 0-.148.004-.22-.005-.206-.006-.411.003-.616-.005-.371-.383-.738-.772-1.11-1.156-.729-.76-1.456-1.523-2.185-2.283-.162-.168-.32-.34-.486-.504-.353.375-.714.744-1.07 1.12l-2.007 2.095c-.234.244-.465.489-.7.728-.203.006-.407 0-.61.003-.117.014-.235.005-.351.008H4.51l5.451-5.513c.094-.094.187-.19.278-.286L4.51 6.204z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12.003 14.858c.47.497.945.99 1.416 1.485.003.98 0 1.959 0 2.94H12c0-1.475 0-2.95.003-4.425h-.001z"
  }));
}
X.DefaultColor = DefaultColor;
var X_default = X;
//# sourceMappingURL=X.js.map
