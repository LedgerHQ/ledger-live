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
  default: () => ELA_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function ELA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.25 16.59L12 14.473v4.227l-3.75-2.112zm0-6.75L12 7.723v4.226L8.25 9.84z",
    fillOpacity: 0.4
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19.5 14.422l-3.75 2.165v-4.264l3.75 2.1zm0-6.75l-3.75 2.165V5.572l3.75 2.1z",
    fillOpacity: 0.7
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.25 16.587v-4.262L12 14.477l-3.75 2.11zm0-6.75V5.575L12 7.727l-3.75 2.11z",
    fillOpacity: 0.8
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15.75 16.587L12 14.478l3.75-2.155v4.264zm0-6.75L12 7.728l3.75-2.156v4.265z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15.75 16.587L12 18.701v-4.223l3.75 2.109zm0-6.75L12 11.951V7.728l3.75 2.109z",
    fillOpacity: 0.6
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.25 12.325v4.263L4.5 14.424l3.75-2.098zm0-6.75v4.263L4.5 7.674l3.75-2.099z",
    fillOpacity: 0.5
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.25 16.453L12 14.338v4.226l-3.75-2.111zm0-6.75L12 7.588v4.226L8.25 9.703z",
    fillOpacity: 0.4
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19.5 14.286l-3.75 2.165v-4.265l3.75 2.1zm0-6.75l-3.75 2.165V5.436l3.75 2.1z",
    fillOpacity: 0.7
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.25 16.45v-4.262L12 14.341l-3.75 2.11zm0-6.75V5.439L12 7.591 8.25 9.7zM15.75 16.45L12 14.343l3.75-2.156v4.265zm0-6.75L12 7.592l3.75-2.156V9.7z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15.75 16.45L12 18.565v-4.223l3.75 2.11zm0-6.75L12 11.815V7.592L15.75 9.7z",
    fillOpacity: 0.6
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.25 12.189v4.262L4.5 14.287l3.75-2.098zm0-6.75v4.262L4.5 7.538l3.75-2.099z",
    fillOpacity: 0.5
  }));
}
ELA.DefaultColor = DefaultColor;
var ELA_default = ELA;
//# sourceMappingURL=ELA.js.map
