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
  default: () => BTC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F7931A";
function BTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M17.622 10.534c.236-1.572-.962-2.417-2.599-2.981l.531-2.13-1.296-.323-.517 2.074c-.34-.085-.69-.165-1.039-.244l.521-2.088-1.296-.323-.53 2.13c-.283-.065-.56-.128-.829-.196l.002-.006L8.782 6l-.345 1.385s.962.22.942.234c.525.131.62.478.604.754L9.378 10.8c.036.009.083.022.135.042l-.137-.033-.848 3.399c-.064.159-.227.398-.594.307.013.019-.942-.235-.942-.235l-.644 1.484 1.688.42c.313.08.62.162.923.24l-.536 2.153 1.295.323.53-2.13c.355.095.698.183 1.034.267l-.53 2.121 1.297.323.536-2.15c2.211.419 3.873.25 4.573-1.75.564-1.609-.028-2.538-1.191-3.143.847-.195 1.485-.753 1.655-1.904zm-2.962 4.154c-.4 1.61-3.111.74-3.99.52l.712-2.853c.88.22 3.697.654 3.278 2.333zm.4-4.177c-.364 1.465-2.62.72-3.352.538l.645-2.588c.732.182 3.089.522 2.708 2.05z"
  }));
}
BTC.DefaultColor = DefaultColor;
var BTC_default = BTC;
//# sourceMappingURL=BTC.js.map
