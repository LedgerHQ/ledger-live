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
var PAY_exports = {};
__export(PAY_exports, {
  default: () => PAY_default
});
module.exports = __toCommonJS(PAY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#302c2c";
function PAY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.183 11.772a.9.9 0 00-.162-.225c-1.426-1.616-4.33-4.797-4.33-4.797l-3.687 4.034-3.735-3.996s-2.937 3.21-4.376 4.842c-.188.185-.188.518-.02.714.748.852 4.42 4.902 4.42 4.902L12 13.186l3.68 4.064 4.437-4.91s.094-.097.114-.162a.56.56 0 00-.047-.406m-14.244.45c-.12-.143-.08-.365.032-.5.47-.534 2.348-2.55 2.348-2.55l2.618 2.78-2.622 2.867s-1.605-1.713-2.376-2.598m11.99.094q-.082.143-.191.266l-2.033 2.209L13.08 12l2.583-2.831s1.488 1.541 2.17 2.37c.058.072.126.14.155.232.063.179.023.378-.059.544" }));
}
PAY.DefaultColor = DefaultColor;
var PAY_default = PAY;
//# sourceMappingURL=PAY.js.map
