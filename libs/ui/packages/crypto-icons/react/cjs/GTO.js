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
  default: () => GTO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#7F27FF";
function GTO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.532 10.5H6.015v5.416a2.041 2.041 0 00.615 1.48c.399.391.943.61 1.507.604h3.396l-.001-7.5zm.127-2.834h.595c.588-1.013 1.126-1.701 1.632-2.073.624-.46 1.263-.464 1.764.028.468.46.556 1.035.248 1.59a2.21 2.21 0 01-.348.455h2.181c.51 0 1.019.418 1.019 1 0 .5-.427 1-1.018 1H12.38V8.332h-.849v1.334H6.269c-.509 0-1.019-.418-1.019-1 0-.5.427-1 1.019-1h2.204a2.47 2.47 0 01-.366-.43c-.365-.557-.32-1.147.156-1.615.5-.492 1.14-.487 1.764-.028.506.372 1.045 1.061 1.633 2.073zm-.986 0c-.435-.693-.823-1.163-1.155-1.407-.307-.224-.475-.226-.655-.049-.185.182-.197.338-.041.575.177.271.55.576 1.086.88h.765zm2.567 0h.915c.512-.294.85-.591.997-.855.128-.228.1-.401-.102-.6-.18-.178-.349-.177-.655.048-.332.244-.721.714-1.154 1.407h-.001zm-.859 2.833h5.518v5.417a2.045 2.045 0 01-.615 1.48c-.403.393-.945.61-1.508.604h-3.395v-7.5z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.532 10.875H6.015v5.416a2.041 2.041 0 00.615 1.48c.399.39.943.61 1.507.604h3.396l-.001-7.5zm.127-2.834h.595c.588-1.013 1.126-1.701 1.632-2.073.624-.46 1.263-.464 1.764.028.468.46.556 1.035.248 1.59a2.21 2.21 0 01-.348.455h2.181c.51 0 1.019.418 1.019 1 0 .5-.427 1-1.018 1H12.38V8.707h-.849v1.334H6.269c-.509 0-1.019-.419-1.019-1 0-.5.427-1 1.019-1h2.204a2.47 2.47 0 01-.366-.43c-.365-.557-.32-1.147.156-1.615.5-.492 1.14-.487 1.764-.028.506.372 1.045 1.06 1.633 2.073zm-.986 0c-.435-.693-.823-1.163-1.155-1.407-.307-.225-.475-.226-.655-.05-.185.183-.197.34-.041.576.177.27.55.576 1.086.88h.765zm2.567 0h.915c.512-.294.85-.591.997-.855.128-.228.1-.402-.102-.6-.18-.178-.349-.177-.655.048-.332.244-.721.714-1.154 1.407h-.001zm-.859 2.833h5.518v5.417a2.045 2.045 0 01-.615 1.48c-.403.393-.945.61-1.508.604h-3.395v-7.5z"
  }));
}
GTO.DefaultColor = DefaultColor;
var GTO_default = GTO;
//# sourceMappingURL=GTO.js.map
