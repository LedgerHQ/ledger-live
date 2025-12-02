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
var TBX_exports = {};
__export(TBX_exports, {
  default: () => TBX_default
});
module.exports = __toCommonJS(TBX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function TBX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.775 20.55A8.775 8.775 0 013 11.775 8.775 8.775 0 0111.775 3a8.775 8.775 0 018.775 8.775 8.775 8.775 0 01-8.775 8.775m2.168-5.775l-2.168-3-2.168 3-1.762-3 1.965-3.36h3.93l1.965 3.36zm.645-7.8H8.963l-2.805 4.8 2.812 4.8h5.618l2.804-4.8z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 20.775A8.775 8.775 0 013.225 12 8.775 8.775 0 0112 3.225 8.775 8.775 0 0120.775 12 8.775 8.775 0 0112 20.775M14.168 15L12 12l-2.167 3-1.763-3 1.965-3.36h3.93L15.93 12zm.645-7.8H9.188L6.383 12l2.812 4.8h5.618l2.804-4.8z" }));
}
TBX.DefaultColor = DefaultColor;
var TBX_default = TBX;
//# sourceMappingURL=TBX.js.map
