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
var HILO_exports = {};
__export(HILO_exports, {
  default: () => HILO_default
});
module.exports = __toCommonJS(HILO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function HILO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 3270 3270", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M3122.13 1635.06C3122.13 813.781 2456.35 148 1635.06 148 813.781 148 148 813.781 148 1635.06c0 821.29 665.781 1487.07 1487.06 1487.07 821.29 0 1487.07-665.78 1487.07-1487.07M1635.06 2942.85c722.27 0 1307.79-585.52 1307.79-1307.79 0-722.264-585.52-1307.778-1307.79-1307.778-722.264 0-1307.779 585.514-1307.779 1307.778 0 722.27 585.515 1307.79 1307.779 1307.79", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M1743.69 1073.46l408.25 408.26h231.27c-.52-1-1.04-2-1.57-3l-1.38-2.58c-15.02-27.8-34.27-53.91-57.75-77.39l-452.05-452.056c-130.26-130.259-341.45-130.259-471.71 0L946.698 1398.75c-24.21 24.21-43.92 51.21-59.13 79.97l-.108.21q-.736 1.395-1.459 2.79h231.259l408.26-408.26c60.25-60.24 157.92-60.24 218.17 0m-218.17 1122.27l-408.26-408.26H886q.775 1.515 1.567 3c.456.87.916 1.73 1.38 2.59 15.016 27.79 34.267 53.91 57.751 77.39l452.052 452.06c130.26 130.25 341.45 130.25 471.71 0l452.05-452.06c24.21-24.21 43.92-51.21 59.13-79.98.53-.99 1.05-1.99 1.57-3h-231.26l-408.26 408.26c-60.25 60.25-157.92 60.25-218.17 0" }));
}
HILO.DefaultColor = DefaultColor;
var HILO_default = HILO;
//# sourceMappingURL=HILO.js.map
