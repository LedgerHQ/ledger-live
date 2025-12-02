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
var ADD_exports = {};
__export(ADD_exports, {
  default: () => ADD_default
});
module.exports = __toCommonJS(ADD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fec807";
function ADD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M18.08 13.844h-3.696l-.66-1.98h4.35a.561.561 0 000-1.122h-4.707l-1.888-5.755a.805.805 0 00-1.59-.052L5.374 18.662a.7.7 0 000 .225.759.759 0 001.492.184l3.788-11.55 1.082 3.22H10.8a.561.561 0 000 1.123h1.32l.66 1.98H10.8a.56.56 0 000 1.122h2.37l1.069 3.168h-5.67a.792.792 0 000 1.584h6.706a.75.75 0 00.752-.752.8.8 0 00-.072-.33l-1.208-3.67h3.3a.561.561 0 100-1.122z", clipRule: "evenodd" }));
}
ADD.DefaultColor = DefaultColor;
var ADD_default = ADD;
//# sourceMappingURL=ADD.js.map
