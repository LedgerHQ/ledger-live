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
  default: () => POA_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function POA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M3.75 18L12 3.75 20.25 18H3.75zm5.154-7.257c.964-.643 1.997-.968 3.096-.968s2.132.325 3.096.968L12 5.395l-3.096 5.348zM7.441 13.27l-2.248 3.883h13.614l-2.248-3.882c-1.357 1.492-2.882 2.25-4.559 2.25s-3.203-.758-4.56-2.25zM12 14.675c1.454 0 2.783-.668 4.003-2.025-1.22-1.36-2.55-2.027-4.003-2.027-1.454 0-2.783.668-4.003 2.026 1.22 1.359 2.55 2.027 4.003 2.027v-.001zm0-.362c-.87 0-1.576-.732-1.576-1.634 0-.902.705-1.633 1.576-1.633.87 0 1.576.732 1.576 1.633 0 .902-.705 1.633-1.576 1.633zm0-.848c.42 0 .759-.352.759-.786a.773.773 0 00-.759-.786.773.773 0 00-.759.786c0 .435.34.787.759.787v-.001z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3.75 19.125L12 4.875l8.25 14.25H3.75zm5.154-7.257c.964-.643 1.997-.968 3.096-.968s2.132.325 3.096.968L12 6.52l-3.096 5.348zm-1.463 2.527l-2.248 3.883h13.614l-2.248-3.882c-1.357 1.492-2.882 2.25-4.559 2.25s-3.203-.758-4.56-2.25zM12 15.8c1.454 0 2.783-.668 4.003-2.025-1.22-1.36-2.55-2.027-4.003-2.027-1.454 0-2.783.668-4.003 2.026C9.216 15.132 10.546 15.8 12 15.8v-.001zm0-.362c-.87 0-1.576-.732-1.576-1.634 0-.902.705-1.633 1.576-1.633.87 0 1.576.732 1.576 1.633 0 .902-.705 1.633-1.576 1.633zm0-.848c.42 0 .759-.352.759-.786a.773.773 0 00-.759-.786.773.773 0 00-.759.786c0 .435.34.787.759.787v-.001z"
  }));
}
POA.DefaultColor = DefaultColor;
var POA_default = POA;
//# sourceMappingURL=POA.js.map
