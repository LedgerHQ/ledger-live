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
var QSP_exports = {};
__export(QSP_exports, {
  default: () => QSP_default
});
module.exports = __toCommonJS(QSP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#454545";
function QSP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.625 12A3.38 3.38 0 0112 8.625 3.38 3.38 0 0115.375 12c0 .49-.107.954-.296 1.375l-2.227-2.228-1.704 1.705 2.228 2.227a3.35 3.35 0 01-1.376.296A3.38 3.38 0 018.625 12m8.86 0a5.45 5.45 0 00-.885-2.983l2.15-2.151-1.616-1.616-2.15 2.151A5.45 5.45 0 0012 6.515a5.46 5.46 0 00-2.983.885L6.866 5.25 5.25 6.866l2.151 2.15a5.46 5.46 0 000 5.967L5.25 17.135l1.616 1.616 2.15-2.151c.86.559 1.883.886 2.984.886a5.45 5.45 0 002.983-.886l2.151 2.151 1.616-1.616-2.151-2.15A5.45 5.45 0 0017.485 12", clipRule: "evenodd" }));
}
QSP.DefaultColor = DefaultColor;
var QSP_default = QSP;
//# sourceMappingURL=QSP.js.map
