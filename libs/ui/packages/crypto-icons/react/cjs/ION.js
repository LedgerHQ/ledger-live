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
var ION_exports = {};
__export(ION_exports, {
  default: () => ION_default
});
module.exports = __toCommonJS(ION_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#57beea";
function ION({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M6.02 14.257a2.036 2.036 0 01-2.27-2.025 2.034 2.034 0 012.012-2.039c.72-3.307 3.652-5.783 7.159-5.783.655 0 1.29.086 1.894.247a2.025 2.025 0 013.125-.308c.38.382.594.9.592 1.44 0 .351-.088.682-.244.97a7.36 7.36 0 011.962 5.015 7.36 7.36 0 01-2.178 5.238c.245.336.389.751.389 1.2a2.033 2.033 0 01-2.03 2.038 2.03 2.03 0 01-1.89-1.293 7.3 7.3 0 01-1.62.18c-3.18 0-5.887-2.035-6.901-4.88m.367-.079c.975 2.676 3.533 4.586 6.534 4.586q.783-.002 1.517-.166a2.032 2.032 0 013.388-1.867 7 7 0 002.053-4.958 6.98 6.98 0 00-1.804-4.694 2.02 2.02 0 01-3.008.15 2.04 2.04 0 01-.593-1.44c0-.281.057-.549.16-.792a7 7 0 00-1.713-.213c-3.312 0-6.084 2.325-6.785 5.44a2.036 2.036 0 011.672 2.008 2.04 2.04 0 01-1.422 1.946zm6.534-.363a2.036 2.036 0 01-2.031-2.041c0-1.128.909-2.041 2.031-2.041s2.032.913 2.032 2.04a2.04 2.04 0 01-2.032 2.042" }));
}
ION.DefaultColor = DefaultColor;
var ION_default = ION;
//# sourceMappingURL=ION.js.map
