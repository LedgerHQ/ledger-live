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
var HSR_exports = {};
__export(HSR_exports, {
  default: () => HSR_default
});
module.exports = __toCommonJS(HSR_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#56428e";
function HSR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.063 5.625h3.265c-.393.622-.634 1.31-.619 2.055q1.459.015 2.918 0a3.43 3.43 0 00-.612-2.055h3.288c-.226.475-.61.915-.574 1.472-.015 2.493.005 4.988-.002 7.48q.484 0 .975.003c.237-.473.449-.955.618-1.455.976.025 1.958-.028 2.93.103-.962.83-1.464 2.01-2.09 3.085-2.486.005-4.97-.008-7.458.007-.117.907.442 1.532 1.09 2.055H7.595c.365-.482 1.1-.793 1.023-1.5.025-2.41 0-4.822.008-7.235h2.13v1.485h2.826V9.422h-5.9L6.214 12q.731 1.29 1.469 2.578h.726v1.735H6.19C5.38 14.873 4.54 13.45 3.75 12v-.002c.793-1.448 1.635-2.87 2.44-4.31q1.243.002 2.483-.008a3.6 3.6 0 00-.611-2.055m2.694 7.25v1.703h2.825v-1.703zm5.186-5.187h2.212c.606.974 1.023 2.1 1.898 2.88.018.057.05.175.067.232-.934.123-1.88.028-2.823.075-.12-.52-.355-.998-.616-1.455l-.738.002zm-2.284 8.842q.982.002 1.963-.002c-.014.835.57 1.352 1.143 1.847h-4.227c.542-.515 1.176-1.003 1.121-1.845" }), /* @__PURE__ */ React.createElement("path", { d: "M8.063 5.625h3.265c-.393.622-.634 1.31-.619 2.055q1.459.015 2.918 0a3.43 3.43 0 00-.612-2.055h3.288c-.226.475-.61.915-.574 1.472-.015 2.493.005 4.988-.002 7.48q.484 0 .975.003c.237-.473.449-.955.618-1.455.976.025 1.958-.028 2.93.103-.962.83-1.464 2.01-2.09 3.085-2.486.005-4.97-.008-7.458.007-.117.907.442 1.532 1.09 2.055H7.595c.365-.482 1.1-.793 1.023-1.5.025-2.41 0-4.822.008-7.235h2.13v1.485h2.826V9.422h-5.9L6.214 12q.731 1.29 1.469 2.578h.726v1.735H6.19C5.38 14.873 4.54 13.45 3.75 12v-.002c.793-1.448 1.635-2.87 2.44-4.31q1.243.002 2.483-.008a3.6 3.6 0 00-.611-2.055m2.694 7.25v1.703h2.825v-1.703zm5.186-5.187h2.212c.606.974 1.023 2.1 1.898 2.88.018.057.05.175.067.232-.934.123-1.88.028-2.823.075-.12-.52-.355-.998-.616-1.455l-.738.002zm-2.284 8.842q.982.002 1.963-.002c-.014.835.57 1.352 1.143 1.847h-4.227c.542-.515 1.176-1.003 1.121-1.845" }));
}
HSR.DefaultColor = DefaultColor;
var HSR_default = HSR;
//# sourceMappingURL=HSR.js.map
