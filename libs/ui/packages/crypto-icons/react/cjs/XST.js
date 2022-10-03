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
  default: () => XST_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#000";
function XST({
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
    d: "M13.268 17.361l2.611-1.404L14.931 14l-1.663 3.361zm2.616-5.29l1.88 3.877.357.734-.718.386-5 2.689-.403.216-.403-.216-5-2.689-.717-.386.355-.733 1.88-3.878-1.877-3.797-.353-.714.69-.399 5-2.889.425-.245.425.245 5 2.89.69.398-.353.714-1.878 3.797zm-5.876-.008L12 7.956l1.992 4.107L12 16.091l-1.992-4.028zM9.07 14l-.95 1.957 2.612 1.404L9.07 14zm-.015-3.866l-.94-1.9L10.7 6.742l-1.645 3.393zM13.3 6.741l2.585 1.494-.94 1.9L13.3 6.74z"
  }));
}
XST.DefaultColor = DefaultColor;
var XST_default = XST;
//# sourceMappingURL=XST.js.map
