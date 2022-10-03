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
  default: () => PLR_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00BFFF";
function PLR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M6.308 15.677h-.074v3.073H4.5V8.344h1.695v.48h.067c.592-.567 1.345-.583 1.768-.583 1.773 0 2.936 1.69 2.936 3.947v.292c0 2.348-1.346 3.748-2.966 3.748-.758.002-1.32-.171-1.692-.552zm3.047-3.057v-.513c0-1.47-.56-2.453-1.558-2.453-1.079 0-1.657 1.143-1.657 2.453v.51c0 1.249.57 2.205 1.687 2.205.88-.003 1.528-.688 1.528-2.202zm2.45-7.37h1.736v10.932h-1.736V5.25zm6.697 4.807c-.974 0-1.94.772-1.94 1.749v4.383h-1.727V8.417h1.6v.478h.065c.389-.41 1.339-.601 2.12-.59.078 0 .014.002.09.002l.008 1.75h-.216zm-.73 4.264H19.5v1.861h-1.727v-1.86z"
  }));
}
PLR.DefaultColor = DefaultColor;
var PLR_default = PLR;
//# sourceMappingURL=PLR.js.map
