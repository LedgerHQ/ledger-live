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
  default: () => PURA_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#333";
function PURA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.394 5.625h5.823c1.611.095 3.383.758 4.095 2.295.89 1.958.448 4.712-1.558 5.83-1.85 1.057-4.062.64-6.093.727-.054 1 .225 2.165-.472 3.01-.28.406-1.567.888-1.567.888s-.118-1.087-.162-3.533c-.028-.675.083-1.432.662-1.87.68-.584 1.641-.402 2.466-.432 1.245-.033 2.553.158 3.735-.322 1.734-.71 1.797-3.604.05-4.333-1.785-.692-3.755-.063-5.588-.445-.833-.233-1.207-1.053-1.39-1.815zM5.25 8.947c1.523.028 3.048-.053 4.568.039 1.104.084 1.83 1.085 1.945 2.108-1.533-.008-3.07.049-4.603-.019-.942-.054-1.638-.82-1.91-1.663v-.464z"
  }));
}
PURA.DefaultColor = DefaultColor;
var PURA_default = PURA;
//# sourceMappingURL=PURA.js.map
