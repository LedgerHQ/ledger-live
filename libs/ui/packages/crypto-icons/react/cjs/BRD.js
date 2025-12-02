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
var BRD_exports = {};
__export(BRD_exports, {
  default: () => BRD_default
});
module.exports = __toCommonJS(BRD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fe5d86";
function BRD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M5.625 6.78c0-.431.354-.78.79-.78h5.692c3.357 0 4.54.396 5.357 1.2a2.57 2.57 0 01.735 1.955c0 1.389-.748 2.33-2.765 2.743 1.948.34 2.937 1.133 2.937 2.726a2.7 2.7 0 01-.765 2.021C16.808 17.434 15.503 18 11.99 18H6.416a.785.785 0 01-.79-.78zm4.32 4.47c0-.287.237-.519.528-.519h1.832c1.046 0 1.828-.051 2.19-.426a.9.9 0 00.243-.668.84.84 0 00-.225-.657c-.368-.361-1.15-.425-2.208-.425h-3.41v6.924h3.375c1.15 0 2-.085 2.398-.481a.92.92 0 00.26-.703.97.97 0 00-.26-.72c-.402-.395-1.253-.425-2.398-.425h-1.785a.53.53 0 01-.503-.33.5.5 0 01-.037-.207z" }));
}
BRD.DefaultColor = DefaultColor;
var BRD_default = BRD;
//# sourceMappingURL=BRD.js.map
