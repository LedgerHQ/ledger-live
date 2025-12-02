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
var POT_exports = {};
__export(POT_exports, {
  default: () => POT_default
});
module.exports = __toCommonJS(POT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#105b2f";
function POT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.025 13.635l-.293 1.49-.532 2.739c-.015.082-.036.138-.141.136q-.992-.013-1.985-.022c-.015 0-.032-.01-.074-.027l1.493-7.455H6.235c.003-.055.001-.088.007-.12.078-.402.16-.804.23-1.209.02-.112.07-.14.175-.14.308.003.615-.008.921.002.147.005.203-.037.231-.181.171-.891.354-1.78.53-2.669.02-.105.044-.178.182-.178 1.506.004 3.013-.01 4.519.01.879.01 1.76.056 2.625.234.298.061.6.14.876.264.793.352 1.271.963 1.404 1.808.206 1.313-.072 2.52-.915 3.571-.623.774-1.476 1.209-2.43 1.473-.755.209-1.53.274-2.312.276q-1.525.002-3.05-.001zm.416-2.053h.212c1.075 0 2.15.002 3.225-.002q.346.002.688-.037c.868-.104 1.527-.52 1.949-1.275a1.6 1.6 0 00.171-1.076c-.088-.523-.4-.864-.93-.96a7.4 7.4 0 00-1.177-.127c-1.104-.02-2.208-.012-3.313-.015-.04 0-.08.006-.133.01l-.183.936h3.068l-.282 1.454H9.659z", clipRule: "evenodd" }));
}
POT.DefaultColor = DefaultColor;
var POT_default = POT;
//# sourceMappingURL=POT.js.map
