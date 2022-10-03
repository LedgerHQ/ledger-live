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
  default: () => BIX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#000";
function BIX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.706 18.433a.75.75 0 01.06.296c0 .426-.351.771-.784.771a.777.777 0 01-.784-.771c0-.102.02-.2.057-.289l-4.657-2.645a.79.79 0 01-.564.236.777.777 0 01-.784-.771c0-.36.25-.662.588-.748v-5.27a.774.774 0 01-.588-.747c0-.426.351-.77.784-.77.26 0 .49.124.633.316l4.554-2.588a.732.732 0 01-.023-.182c0-.426.352-.771.784-.771a.778.778 0 01.763.949l4.58 2.602a.786.786 0 01.641-.327c.433 0 .784.345.784.771 0 .36-.251.663-.59.748l-.014 5.265c.346.08.604.386.604.752a.777.777 0 01-.784.77.788.788 0 01-.582-.255l-4.678 2.658zm-.21-.285l4.716-2.68a.76.76 0 01.015-.466l-4.549-2.925a.93.93 0 01-1.086.198.93.93 0 01-.326-.263l-4.483 3.02a.76.76 0 01-.003.462l4.681 2.659a.788.788 0 01.521-.195c.197 0 .377.071.514.189zm.09-12.385a.788.788 0 01-.41.255l-.012 4.542a.916.916 0 01.762.897.887.887 0 01-.06.322l4.553 2.928a.782.782 0 01.371-.199l.014-5.258a.775.775 0 01-.612-.87l-4.606-2.617zm-1.204.004L6.806 8.365a.775.775 0 01-.612.885v5.254c.16.033.3.113.408.225l4.504-3.034a.917.917 0 01.701-1.129l.012-4.54a.785.785 0 01-.437-.26z"
  }));
}
BIX.DefaultColor = DefaultColor;
var BIX_default = BIX;
//# sourceMappingURL=BIX.js.map
