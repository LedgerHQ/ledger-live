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
  default: () => DENT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#666";
function DENT({
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
    d: "M18.811 15.863a1.15 1.15 0 01-1.554.408l-3.584-2.032v-1.29l1.139-.645 3.583 2.031c.545.309.73.993.416 1.527zm-5.673 2.744c0 .617-.51 1.117-1.138 1.117-.629 0-1.138-.5-1.138-1.117v-4.064L12 13.898l1.138.645v4.064zM6.742 16.27a1.15 1.15 0 01-1.554-.41 1.106 1.106 0 01.417-1.526l3.583-2.032 1.139.646v1.29L6.742 16.27zM5.605 9.664a1.107 1.107 0 01-.417-1.526 1.15 1.15 0 011.554-.41l3.585 2.033v1.29l-1.139.645-3.583-2.031zm5.257-4.27c0-.618.51-1.118 1.138-1.118.628 0 1.138.5 1.138 1.117v4.064L12 10.102l-1.138-.645V5.393zm2.811 6.265l.603.341-.603.341v-.682zm-1.138-1.253l.603-.342v.684l-.603-.342zm-1.673.341v-.682l.602.341-.602.341zm-.535 1.594L9.724 12l.603-.341v.682zm1.137 1.253l-.602.342v-.684l.602.342zm1.674-.341v.682l-.603-.341.603-.341zM12 13.29l-1.138-.645v-1.29L12 10.71l1.138.645v1.29L12 13.29zm5.257-5.561a1.15 1.15 0 011.554.41 1.106 1.106 0 01-.416 1.526l-3.583 2.032-1.139-.646v-1.29l3.584-2.032zm1.406 6.151L15.347 12l3.316-1.88a1.629 1.629 0 00.613-2.245 1.69 1.69 0 00-2.286-.601l-3.317 1.88V5.393c0-.907-.75-1.643-1.673-1.643-.924 0-1.673.736-1.673 1.643v3.76L7.01 7.274a1.69 1.69 0 00-2.285.602 1.628 1.628 0 00.613 2.245L8.653 12l-3.315 1.88a1.628 1.628 0 00-.614 2.245 1.69 1.69 0 002.286.602l3.317-1.88v3.76c0 .907.749 1.643 1.673 1.643s1.673-.736 1.673-1.643v-3.76l3.317 1.88a1.69 1.69 0 002.286-.602 1.629 1.629 0 00-.613-2.245z"
  }));
}
DENT.DefaultColor = DefaultColor;
var DENT_default = DENT;
//# sourceMappingURL=DENT.js.map
