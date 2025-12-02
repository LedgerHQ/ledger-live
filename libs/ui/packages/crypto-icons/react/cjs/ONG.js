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
var ONG_exports = {};
__export(ONG_exports, {
  default: () => ONG_default
});
module.exports = __toCommonJS(ONG_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function ONG({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M11.982 19.992c4.305 0 7.566-2.885 8.243-6.659h-3.673c-.549 2.004-2.253 3.471-4.526 3.471-2.257 0-3.983-1.477-4.555-3.47H3.775c.652 3.787 3.885 6.658 8.207 6.658", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M12.003 7.799a1.895 1.895 0 100-3.79 1.895 1.895 0 000 3.79" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M7.266 13.333v-.037c0-2.695 1.93-4.895 4.714-4.895s4.755 2.237 4.76 4.932z", clipRule: "evenodd" }));
}
ONG.DefaultColor = DefaultColor;
var ONG_default = ONG;
//# sourceMappingURL=ONG.js.map
