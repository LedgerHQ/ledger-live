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
var QCK_exports = {};
__export(QCK_exports, {
  default: () => QCK_default
});
module.exports = __toCommonJS(QCK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#9b9b9b";
function QCK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 19 19", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M5.777 1.762c-1.46.554-2.195 1.047-3.382 2.297C1.188 5.344.515 6.69.18 8.53c-.278 1.582-.043 3.227.75 4.867.535 1.168 2.078 2.95 2.968 3.465l.594.336-.097-.949c-.079-.89-.04-1.012.671-1.8 1.032-1.13 1.922-1.723 5.145-3.348 1.527-.77 3.187-1.7 3.703-2.098 2.828-2.156 2.078-5.027-1.84-6.887-1.129-.554-1.523-.633-3.265-.672-1.586-.058-2.2.02-3.032.317m11.641 10.094c0 .497-.89 1.227-2.555 2.098-.75.395-1.465.93-1.601 1.207-.633 1.149.691 2.453 2.472 2.453 1.188 0 2.098-.492 2.832-1.582.672-.988.551-2.808-.218-3.84-.614-.793-.93-.91-.93-.336m0 0" }));
}
QCK.DefaultColor = DefaultColor;
var QCK_default = QCK;
//# sourceMappingURL=QCK.js.map
