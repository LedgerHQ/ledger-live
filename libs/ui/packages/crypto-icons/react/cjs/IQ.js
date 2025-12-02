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
var IQ_exports = {};
__export(IQ_exports, {
  default: () => IQ_default
});
module.exports = __toCommonJS(IQ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#5df";
function IQ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.05 7.786a5.72 5.72 0 011.5-3.84c.262-.262.292-.315.292-.525s0-.225-.158-.225a4 4 0 00-.577.105A9.07 9.07 0 004.64 7.104a8.5 8.5 0 00-1.275 3 10.6 10.6 0 00-.135 3 8.75 8.75 0 003.12 5.677c.922.75 1.957 1.35 1.957 1.08a1.1 1.1 0 00-.24-.308 4.76 4.76 0 01-1.192-3.817 5.45 5.45 0 012.55-4.2q.274-.196.577-.345c.112 0 .045-.225-.232-.75a5.2 5.2 0 01-.72-2.655m11.632 2.34a9 9 0 00-4.56-6.12c-.42-.232-.63-.285-.63-.142q.06.18.18.33c.465.66.726 1.442.75 2.25a3 3 0 01-.75 2.34.81.81 0 01-1.133.045c-.3-.218-.3-.368-.112-.645a3.27 3.27 0 00.563-1.988 1.91 1.91 0 00-.556-1.552 1.45 1.45 0 00-1.454-.383 2.38 2.38 0 00-1.44 1.725 7 7 0 00-.3 1.71c.005.889.224 1.763.637 2.55.288.452.645.857 1.057 1.2a1 1 0 01.218.195.7.7 0 01-.247.127 4.8 4.8 0 00-2.49 2.783 5.4 5.4 0 00-.36 2.213 2.57 2.57 0 00.75 1.927 2.49 2.49 0 002.1.563 3.95 3.95 0 002.595-1.245c.307-.33.367-.368.427-.293s.045.12-.067.307a5.63 5.63 0 01-3.203 2.535c-.262.068-.375.12-.375.18 0 .195 1.643-.075 2.64-.427a9.07 9.07 0 005.475-5.595 7.1 7.1 0 00.413-2.79 7 7 0 00-.128-1.8" }));
}
IQ.DefaultColor = DefaultColor;
var IQ_default = IQ;
//# sourceMappingURL=IQ.js.map
