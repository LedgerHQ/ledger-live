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
  default: () => CMM_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2FD2E5";
function CMM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M10.8 3.116a8.84 8.84 0 00-5.635 1.78 1.324 1.324 0 00-.082 2.05 1.301 1.301 0 001.692.08 6.29 6.29 0 018.47.683c.443.458.456 1.179.032 1.653a1.19 1.19 0 01-1.684.058l-.058-.058a3.928 3.928 0 100 5.294 1.168 1.168 0 011.81.081 1.184 1.184 0 01-.068 1.507 6.31 6.31 0 01-8.505.747 1.324 1.324 0 00-1.703.082 1.34 1.34 0 00.112 2.067A8.889 8.889 0 1010.8 3.117zm-.166 11.091a2.2 2.2 0 11.016-4.401 2.2 2.2 0 01-.015 4.401z"
  }));
}
CMM.DefaultColor = DefaultColor;
var CMM_default = CMM;
//# sourceMappingURL=CMM.js.map
