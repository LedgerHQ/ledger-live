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
  default: () => MSR_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#47B95C";
function MSR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.003 4.5c-4.14 0-7.5 3.36-7.5 7.5 0 .1.01.195.015.295h3.52l1.7-2.925 2.265 3.245 2.26-3.245 1.7 2.925h3.52c.005-.1.014-.195.014-.295.006-4.14-3.354-7.5-7.494-7.5zm5.17 6.89a5.212 5.212 0 00-5.17-4.595 5.217 5.217 0 00-5.17 4.595h-.91a6.116 6.116 0 016.08-5.5c3.165 0 5.77 2.415 6.08 5.5h-.91z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14.198 11.05l-2.195 3.15-2.196-3.15-1.25 2.15h-3.95c.576 3.57 3.66 6.3 7.396 6.3 3.735 0 6.82-2.73 7.395-6.305h-3.95l-1.25-2.145zm2.565 3.05h.97c-.86 2.335-3.1 4.01-5.73 4.01-2.63 0-4.87-1.675-5.73-4.01h.97a5.213 5.213 0 004.76 3.105c2.124 0 3.95-1.28 4.76-3.105z"
  }));
}
MSR.DefaultColor = DefaultColor;
var MSR_default = MSR;
//# sourceMappingURL=MSR.js.map
