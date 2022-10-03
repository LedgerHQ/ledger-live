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
  default: () => TEL_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#14C8FF";
function TEL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.81 8.609c.475.384.774 1.18.669 1.764l-1.02 5.643c-.107.588-.669 1.236-1.248 1.439l-5.564 1.954c-.58.203-1.44.056-1.914-.329l-4.544-3.688c-.474-.384-.774-1.176-.667-1.764l1.02-5.643c.106-.588.668-1.235 1.248-1.439l5.565-1.954c.58-.204 1.44-.056 1.915.328l4.54 3.689zm-4.733 2.533l.226-1.147-2.124.003.3-1.512h-.686a4.319 4.319 0 01-2.061 1.67l-.193.988h.929s-.315 1.42-.42 1.945c-.263 1.335.397 2.282 1.411 2.282h1.716l.3-1.268H12.04c-.638 0-.604-.349-.48-.967l.395-1.997 2.122.003z"
  }));
}
TEL.DefaultColor = DefaultColor;
var TEL_default = TEL;
//# sourceMappingURL=TEL.js.map
