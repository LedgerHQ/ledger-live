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
var REQ_exports = {};
__export(REQ_exports, {
  default: () => REQ_default
});
module.exports = __toCommonJS(REQ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00e6a0";
function REQ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.103 5.657a.5.5 0 01.357.144l-.004-.005c.074.074.122.17.138.273l.006.078-.005 2.563c0 .337-.133.66-.372.898l-3.18 3.17 3.403 3.393a1.266 1.266 0 11-1.787 1.795l-4.302-4.288a1.264 1.264 0 010-1.796l3.767-3.759H8.75v8.917a1.27 1.27 0 01-1.288 1.288l-.128-.004a1.27 1.27 0 01-1.161-1.284V7.042c0-.8.572-1.385 1.347-1.385z" }));
}
REQ.DefaultColor = DefaultColor;
var REQ_default = REQ;
//# sourceMappingURL=REQ.js.map
