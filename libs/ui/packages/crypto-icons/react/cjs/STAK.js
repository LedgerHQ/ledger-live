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
var STAK_exports = {};
__export(STAK_exports, {
  default: () => STAK_default
});
module.exports = __toCommonJS(STAK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f2941b";
function STAK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.463 3.51h.008c1.554 1.537 3.09 3.09 4.636 4.635h3.855L12.284 20.44c-.144-1.444-.255-2.888-.382-4.33 1.257-1.809 2.548-3.6 3.805-5.4l-2.87-2.862a7 7 0 00-.085-1.01c-.094-1.104-.154-2.225-.29-3.329M3.046 15.853c2.913-4.092 5.8-8.201 8.704-12.302l.365 4.347C10.85 9.706 9.576 11.49 8.311 13.29c.942.942 1.884 1.901 2.845 2.844.127 1.443.237 2.904.382 4.356h-.018l-4.61-4.62c-1.29.018-2.581-.008-3.872.018v-.035z" }));
}
STAK.DefaultColor = DefaultColor;
var STAK_default = STAK;
//# sourceMappingURL=STAK.js.map
