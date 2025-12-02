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
var BTG_exports = {};
__export(BTG_exports, {
  default: () => BTG_default
});
module.exports = __toCommonJS(BTG_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#eba809";
function BTG({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5m-.741-15.195q.002.984.002 1.969l.982.001q.004-1.01 0-2.019-.493.016-.984.049m2.364 2c.864.117 1.793.248 2.48.831 1.051.943.915 2.922-.371 3.606.77.18 1.533.692 1.723 1.501.247 1.06.05 2.332-.802 3.08-.844.693-1.987.785-3.032.884q.005.92.001 1.842c2.198-.536 4.095-2.17 4.901-4.286.765-1.951.585-4.247-.496-6.045-.955-1.62-2.578-2.812-4.4-3.268q-.007.928-.003 1.855zm-6.56-.026c.953.045 1.906.036 2.858.035 0-.58.002-1.158-.003-1.737-1.066.345-2.016.966-2.855 1.702m-1.11 1.492c-1.12 1.906-1.246 4.35-.312 6.355.806 1.797 2.406 3.194 4.279 3.797q.003-.868.002-1.734c-.956-.01-1.915.025-2.869-.026.01-.533.135-1.053.318-1.554.468-.01.956.072 1.408-.08.264-.222.189-.589.202-.893-.013-1.735.008-3.471-.008-5.207.017-.28-.159-.582-.45-.637-.48-.095-.973-.058-1.458-.061-.058-.39-.064-.785-.07-1.18a.3.3 0 00-.053-.232c-.275.521-.711.933-.989 1.452m5.348.076v2.56c.855-.016 1.804.079 2.552-.418.621-.405.582-1.435-.06-1.8-.748-.444-1.662-.318-2.492-.342m0 3.936v2.839c1.055-.085 2.24.092 3.16-.544.656-.436.577-1.515-.1-1.892-.92-.55-2.038-.375-3.06-.403m-.039 4.444l-.003 1.97q.513.033 1.026.045.002-1.007.001-2.015z", clipRule: "evenodd" }));
}
BTG.DefaultColor = DefaultColor;
var BTG_default = BTG;
//# sourceMappingURL=BTG.js.map
