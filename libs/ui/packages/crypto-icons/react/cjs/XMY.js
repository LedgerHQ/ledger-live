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
var XMY_exports = {};
__export(XMY_exports, {
  default: () => XMY_default
});
module.exports = __toCommonJS(XMY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function XMY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.788 15.75c-.452 0-.948-.227-.948-.909q0-.504.786-3.099.16-.4.16-.72c0-.408-.314-.817-.9-.817-.341 0-1.083.135-1.308.863q-.225.727-1.037 3.864-.315.818-1.127.818c-.811 0-.947-.591-.947-.955q0-.216.649-2.61.252-.798.252-1.162c0-.364-.27-.818-.901-.818-.63 0-1.217.454-1.487 1.454q-.27 1-.767 3-.27 1.09-1.217 1.091-.856 0-.901-.955l1.036-4.318H4.832a1.067 1.067 0 01-1.026-1.472A1.07 1.07 0 014.81 8.34h3.854q.811 0 .992.772c.541-.68 1.262-.863 1.894-.863s1.442.364 1.803 1.182c.495-.546 1.352-1.182 2.57-1.182 1.126 0 2.073.773 2.073 2.136q0 .773-.766 3.228l1.977-.014c.579 0 1.043.482 1.043 1.075s-.464 1.075-1.037 1.075z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.8 15.75c-.452 0-.948-.227-.948-.909q0-.504.786-3.099.16-.4.16-.72c0-.408-.314-.817-.9-.817-.341 0-1.083.135-1.308.863q-.225.727-1.037 3.864-.315.818-1.127.818c-.811 0-.947-.591-.947-.955q0-.216.649-2.61.252-.798.252-1.162c0-.364-.27-.818-.901-.818-.63 0-1.217.454-1.487 1.454q-.27 1-.767 3-.27 1.09-1.217 1.091-.857 0-.902-.955l1.037-4.318H4.844a1.067 1.067 0 01-1.026-1.472 1.07 1.07 0 011.004-.664h3.854q.81 0 .991.772c.542-.68 1.263-.863 1.895-.863s1.442.364 1.803 1.182c.495-.546 1.352-1.182 2.57-1.182 1.126 0 2.073.773 2.073 2.136q0 .773-.766 3.228l1.977-.014c.579 0 1.043.482 1.043 1.075s-.464 1.075-1.037 1.075z", clipRule: "evenodd" }));
}
XMY.DefaultColor = DefaultColor;
var XMY_default = XMY;
//# sourceMappingURL=XMY.js.map
