"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var WTC_exports = {};
__export(WTC_exports, {
  default: () => WTC_default
});
module.exports = __toCommonJS(WTC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function WTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M13.81 9.874L13.3 10c-.46.112-.783.517-.783.982v3.404l-1.685.412a.517.517 0 01-.642-.492V8.64a.51.51 0 01.392-.492l2.586-.633a.517.517 0 01.642.491zm-5.689-.031L7.482 10c-.46.112-.784.517-.784.982v3.435l-1.555.381a.517.517 0 01-.643-.492V8.64a.51.51 0 01.391-.492l2.587-.633a.518.518 0 01.642.491zm8.15-1.68l2.586-.632a.517.517 0 01.643.491v5.667a.51.51 0 01-.392.491l-2.586.633a.517.517 0 01-.642-.491V8.655c0-.233.161-.435.391-.491", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.673 9.986v4.32q0 .124.03.246a1.035 1.035 0 001.133.76v.704a.51.51 0 01-.392.492l-2.585.633a.52.52 0 01-.628-.369.5.5 0 01-.015-.123v-5.667c0-.232.161-.435.391-.491zm5.69.031v4.305q0 .125.03.246c.139.542.7.872 1.255.737l.007-.002v.712a.51.51 0 01-.391.492l-2.587.633a.52.52 0 01-.627-.368.5.5 0 01-.015-.123v-5.667c0-.232.161-.435.392-.491z", clipRule: "evenodd", opacity: 0.504 }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M13.81 9.547l-.51.125c-.46.112-.783.517-.783.982v3.404l-1.685.412a.517.517 0 01-.642-.492V8.312a.51.51 0 01.392-.492l2.586-.633a.517.517 0 01.642.491zm-5.689-.032l-.639.157c-.46.112-.784.517-.784.982v3.435l-1.555.381a.517.517 0 01-.643-.492V8.312a.51.51 0 01.391-.492l2.587-.633a.518.518 0 01.642.491zm8.15-1.68l2.586-.632a.517.517 0 01.643.491v5.667a.51.51 0 01-.392.491l-2.586.633a.517.517 0 01-.642-.49V8.326c0-.232.161-.435.391-.491", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.673 9.658v4.32q0 .124.03.246a1.035 1.035 0 001.133.76v.704a.51.51 0 01-.392.492l-2.585.633a.52.52 0 01-.628-.369.5.5 0 01-.015-.123v-5.667c0-.232.161-.435.391-.49zm5.69.031v4.305q0 .124.03.246c.139.542.7.872 1.255.737l.007-.002v.713a.51.51 0 01-.391.492l-2.587.633a.517.517 0 01-.642-.492v-5.667c0-.232.161-.435.392-.49z", clipRule: "evenodd", opacity: 0.504 }));
}
WTC.DefaultColor = DefaultColor;
var WTC_default = WTC;
//# sourceMappingURL=WTC.js.map
