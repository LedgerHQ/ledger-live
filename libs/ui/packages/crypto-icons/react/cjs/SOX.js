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
var SOX_exports = {};
__export(SOX_exports, {
  default: () => SOX_default
});
module.exports = __toCommonJS(SOX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function SOX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M3.137 12.013a8.99 8.99 0 1117.98 0 8.99 8.99 0 01-17.98 0m8.99-7.99a7.99 7.99 0 100 15.98 7.99 7.99 0 000-15.98", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M8.957 10.203l-2.164 2.99c1.235 0 3.013.944 3.448 2.22l1.534-2.105c.241-.347.451-.618.963-.724l1.904-.381c.139-.977.054-2.837-.835-3.855-.318.057-1.238.204-2.539.354-1.428.165-1.881.946-2.311 1.501m5.685-2.013c.89 1.019.974 2.878.835 3.855l1.488-.315c.139-.976.054-2.836-.835-3.854zM6.42 14.078c1.289-.208 2.733.602 3.227 2.133-2.592 1.49-3.49-1.31-3.227-2.133" }));
}
SOX.DefaultColor = DefaultColor;
var SOX_default = SOX;
//# sourceMappingURL=SOX.js.map
