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
var FIL_exports = {};
__export(FIL_exports, {
  default: () => FIL_default
});
module.exports = __toCommonJS(FIL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#42c1ca";
function FIL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.57 9.514c.278-1.172.614-2.226.971-2.914.132-.328.664-1.115 1.249-1.635.972-.866 2.064-1.086 3.2-.373l-.1.159.1-.159c.58.364.812.738.71 1.09-.075.263-.362.473-.516.452a.93.93 0 01-.668-.182 1.26 1.26 0 01-.405-.54c-.16-.376-.368-.503-.623-.473a.9.9 0 00-.47.219l-.176.195a3 3 0 00-.363.476c-.356.595-.686 1.685-1.142 3.943l3.026.443-.166 1.213-3.072-.45-.131.798-.034.2-.06.335 3.102.455-.178 1.211-3.174-.465c-.367 1.559-.85 3.229-1.191 3.888-.133.33-.664 1.115-1.248 1.635-.973.866-2.065 1.086-3.2.373-.58-.364-.813-.739-.711-1.091.075-.263.362-.472.516-.45a.93.93 0 01.667.18q.253.183.406.542c.16.374.368.502.623.472.186-.021.401-.14.47-.22.68-.757 1.219-2.216 1.9-5.587l-3.027-.444.167-1.213 3.072.45.132-.797q.044-.269.094-.536l-3.09-.452.177-1.212z" }));
}
FIL.DefaultColor = DefaultColor;
var FIL_default = FIL;
//# sourceMappingURL=FIL.js.map
