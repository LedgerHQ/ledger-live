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
var CND_exports = {};
__export(CND_exports, {
  default: () => CND_default
});
module.exports = __toCommonJS(CND_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#383939";
function CND({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M14.98 8.61l2-.459.775-1.276-.765-1.255-.98-.676-2.012-.444-1.241.7-1.986-.354-2.727 1.889-.213 2.206-1.157.483.134 2.047-.808.644.807 2.304.121.241.854 2.372 1.754.622 1.3 1.323 1.496.523.677-.195 1.073-.124 1.573-.45L18 17.406l-.613-2.424-1.181-.465-.588.672-1.654.407-2.405-.381-.776-.898.27-.878-1.137-1.8.956-1.166.102-1.984 1.37-.786.939-.375 1.274.23z", clipRule: "evenodd" }));
}
CND.DefaultColor = DefaultColor;
var CND_default = CND;
//# sourceMappingURL=CND.js.map
