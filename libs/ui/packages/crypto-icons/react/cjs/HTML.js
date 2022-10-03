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
  default: () => HTML_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#CFA967";
function HTML({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.015 12.334v5.994l4.46-1.201 1.048-11.542h-5.508v4.898l.228-.71h.597l-.825 2.56zm-5.538 5.643L5.25 4.5h13.5l-1.227 13.477-5.538 1.523-5.508-1.523zm3.872-5.095v-.556l-1.851-.738 1.852-.742v-.557l-2.645 1.075v.444l2.644 1.074zm5.95-1.074l-2.645 1.074v-.556l1.852-.74-1.852-.74v-.557l2.645 1.075v.444zm-4.284.525v-1.85l-.988 3.08h.591l.397-1.23z"
  }));
}
HTML.DefaultColor = DefaultColor;
var HTML_default = HTML;
//# sourceMappingURL=HTML.js.map
