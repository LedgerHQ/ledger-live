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
var BTCD_exports = {};
__export(BTCD_exports, {
  default: () => BTCD_default
});
module.exports = __toCommonJS(BTCD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f60";
function BTCD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.809 14.517c3.81-1.175 2.45-5.125 0-5.275.622 0 1.13-1.783 1.13-3.992 5.983.425 8.793 10.283-.18 13.367.058-.8-.27-3.033-.95-4.1M4.5 13.35v-4.1h.008c2.163-.008 3.908-1.8 3.901-3.992h4.17c0 4.475-3.613 8.092-8.079 8.092m5.465-.742c2.475 2.034 2.615 5.459 2.615 6.142H8.409c0-2.267-1.475-4.1-3.302-4.1 3.097-.5 3.728-1.025 4.858-2.042" }));
}
BTCD.DefaultColor = DefaultColor;
var BTCD_default = BTCD;
//# sourceMappingURL=BTCD.js.map
