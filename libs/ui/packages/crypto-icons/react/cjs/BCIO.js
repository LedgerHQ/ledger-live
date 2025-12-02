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
var BCIO_exports = {};
__export(BCIO_exports, {
  default: () => BCIO_default
});
module.exports = __toCommonJS(BCIO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3f43ad";
function BCIO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.973 5.877a.658.658 0 000 1.313.658.658 0 000-1.313m3.038-1.823a.658.658 0 000 1.314.658.658 0 000-1.314m0 7.29a.657.657 0 000 1.313.658.658 0 000-1.314m3.037-1.823a.657.657 0 10.001 1.314.657.657 0 00-.001-1.314m3.036-1.822a.658.658 0 10-.042 1.315.658.658 0 00.042-1.315m-9.11 5.467a.658.658 0 000 1.313.658.658 0 000-1.313M5.935 7.699a.657.657 0 10.001 1.314.657.657 0 00-.001-1.314m0 7.289a.658.658 0 10.001 1.315.658.658 0 00-.001-1.315m0-3.645a.658.658 0 000 1.314.658.658 0 000-1.314M12.01 7.7a.657.657 0 10-.045 1.314.657.657 0 00.045-1.314m3.037-1.822a.658.658 0 10-.043 1.315.658.658 0 00.043-1.315m0 7.289a.657.657 0 100 1.314.657.657 0 000-1.314m3.036-1.823a.657.657 0 000 1.314.658.658 0 000-1.314m-3.036 5.467a.658.658 0 100 1.317.658.658 0 000-1.317m3.036-1.822a.657.657 0 000 1.314.658.658 0 000-1.314m-6.073 3.645a.658.658 0 000 1.313.658.658 0 000-1.313m0-3.645a.659.659 0 10.001 1.317.659.659 0 00-.001-1.317M8.973 9.52a.658.658 0 000 1.313.658.658 0 000-1.312zm0 7.29a.658.658 0 000 1.312.658.658 0 000-1.313" }));
}
BCIO.DefaultColor = DefaultColor;
var BCIO_default = BCIO;
//# sourceMappingURL=BCIO.js.map
