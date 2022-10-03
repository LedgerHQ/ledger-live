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
  default: () => GIN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#008DDE";
function GIN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M18.057 12.764a.543.543 0 00.566-.545.545.545 0 00-.566-.545h-1.245v-1.231h2.604a.547.547 0 00.398-.938.545.545 0 00-.398-.152h-2.614a2.652 2.652 0 00-2.2-2.376V5.665a.545.545 0 10-1.09 0V6.94H12.28V4.074a.545.545 0 10-1.09 0V6.94H9.958V5.664a.545.545 0 00-1.09 0v1.313a2.652 2.652 0 00-2.2 2.376H3.59a.545.545 0 100 1.09h3.067v1.231H5.413a.547.547 0 00-.398.938.544.544 0 00.398.152h1.245v1.231H4.286a.545.545 0 100 1.09h2.382a2.652 2.652 0 002.2 2.376v.848a.546.546 0 101.09 0v-.811h1.232v2.468a.545.545 0 001.09 0v-2.468h1.23v1.275a.543.543 0 00.546.565.547.547 0 00.545-.565v-1.311a2.651 2.651 0 002.2-2.376h3.608a.543.543 0 00.566-.545.545.545 0 00-.566-.545h-3.596v-1.231h1.244v-.001zm-2.115 2.086a1.78 1.78 0 01-1.777 1.778h-4.86a1.78 1.78 0 01-1.778-1.778V9.587a1.779 1.779 0 011.778-1.778h4.86a1.779 1.779 0 011.777 1.778v5.263z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M10.461 9.096a6.252 6.252 0 00-.63.021c-.332.038-.576.338-.586.663-.017.738-.003 1.478-.008 2.216.01.376-.025.757.03 1.13.054.333.38.548.702.547 1.005.007 2.01.002 3.015.003v.416H9.748l-.416 1.249h3.22c.377-.01.757.025 1.13-.03.334-.053.547-.378.547-.701.007-1.315.001-2.63.003-3.945-.012-.353.031-.712-.04-1.06-.076-.355-.456-.53-.792-.508h-2.307c-.21.004-.422 0-.632-.002zm.025 1.25h2.498v2.081h-2.498v-2.081z"
  }));
}
GIN.DefaultColor = DefaultColor;
var GIN_default = GIN;
//# sourceMappingURL=GIN.js.map
