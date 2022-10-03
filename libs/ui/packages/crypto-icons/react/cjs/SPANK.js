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
  default: () => SPANK_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FF3B81";
function SPANK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M6.345 16.606v.105H5.237v-2l-.035.111-1.058-.32.598-1.927-.074.108-.918-.61 1.148-1.675-.11.087-.697-.848L5.74 8.32l-.21.08-.397-1.018 1.972-.745-.231.015-.077-1.088 2.064-.142-.186-.042.249-1.063 1.972.449-.124-.071.552-.945 1.72.978-.067-.07.81-.745 1.34 1.415-.03-.057.996-.478.86 1.735-.008-.049 1.093-.17.322 2.004.023-.143 1.094.17-.327 2.035.08-.164.995.479-.92 1.86.134-.142.81.745-1.432 1.512.173-.098.554.944-1.8 1.024.181-.042.25 1.063-1.99.452.155.01-.078 1.089-1.99-.137.101.038-.397 1.018-1.905-.72.12.096-.696.848-1.573-1.255.078.113-.918.611-1.125-1.643.034.108-1.06.32-.587-1.898zm0-1.296l.691-.209.537 1.733.599-.398 1.021 1.493.457-.555 1.416 1.13.253-.651 1.707.645.05-.704 1.827.126-.165-.702 1.79-.407-.37-.633 1.598-.909-.548-.502 1.263-1.334-.674-.324.812-1.64-.736-.115.29-1.8-.706.11-.288-1.8-.635.304-.806-1.627-.518.474-1.246-1.317-.357.609-1.579-.898-.163.696-1.776-.404.051.727-1.823.125.27.692-1.718.65.463.561-1.442 1.15.608.404-1.038 1.518.7.211-.542 1.748h.727v1.823zm5.437-2.044c0-.276-.097-.487-.292-.633-.195-.15-.543-.305-1.049-.467a7.432 7.432 0 01-1.2-.488c-.802-.435-1.204-1.02-1.204-1.757 0-.383.106-.724.32-1.023.217-.302.526-.538.928-.707a3.507 3.507 0 011.36-.252c.506 0 .956.092 1.35.277.395.182.701.44.919.774.221.339.336.736.33 1.14h-1.457c0-.325-.102-.577-.306-.755-.204-.181-.49-.272-.86-.272-.356 0-.634.075-.83.229a.709.709 0 00-.297.593c0 .23.115.424.345.58.232.155.574.302 1.024.438.83.25 1.434.56 1.812.93.38.37.569.832.569 1.383 0 .614-.232 1.096-.695 1.447-.463.347-1.086.521-1.87.521a3.627 3.627 0 01-1.487-.297c-.446-.201-.788-.476-1.024-.823a2.115 2.115 0 01-.35-1.208H9.28c0 .782.467 1.174 1.399 1.174.346 0 .617-.07.811-.21a.697.697 0 00.292-.594zm4.448-4.348l-1.405 5.139-1.157-.082.875-5.297 1.687.24zm-1.226 5.674l-.365 1.816-1.54-.45.354-1.741 1.551.375z"
  }));
}
SPANK.DefaultColor = DefaultColor;
var SPANK_default = SPANK;
//# sourceMappingURL=SPANK.js.map
