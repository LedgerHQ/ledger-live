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
  default: () => SUB_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#E53431";
function SUB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.93 3.94a.188.188 0 01.225 0l.942.706a.187.187 0 11-.226.3l-.83-.62L6.345 6.35l11.85 8.89a.188.188 0 010 .303l-.87.652a.188.188 0 01-.226-.301l.67-.503-11.85-8.889a.186.186 0 010-.3l3.011-2.26V3.94zm3.012 0a.185.185 0 01.225-.002l6.026 4.52a.185.185 0 01.065.21.187.187 0 01-.178.129h-3.013a.19.19 0 01-.112-.038L11 5.794a.188.188 0 11.226-.302L15.13 8.42h2.384l-5.46-4.095-3.78 2.835a.188.188 0 01-.225-.301l3.892-2.919zM6.75 7.836a.189.189 0 01.225.302l-.63.472 11.85 8.89a.187.187 0 010 .302l-3.013 2.26a.19.19 0 01-.225 0l-.872-.654a.19.19 0 01.227-.302l.758.568 2.7-2.025L5.915 8.761a.19.19 0 010-.302l.833-.622h.001zM6.03 15.2v.002h3.012c.04 0 .08.013.113.037l3.912 2.934a.188.188 0 01-.225.301l-3.86-2.896H6.595l5.461 4.096 3.773-2.83a.189.189 0 11.226.302l-3.886 2.913a.188.188 0 01-.225 0L5.916 15.54a.188.188 0 11.114-.34z"
  }));
}
SUB.DefaultColor = DefaultColor;
var SUB_default = SUB;
//# sourceMappingURL=SUB.js.map
