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
var SIN_exports = {};
__export(SIN_exports, {
  default: () => SIN_default
});
module.exports = __toCommonJS(SIN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f5342e";
function SIN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 12.093a7.7 7.7 0 01.38-2.461c.295-.9.757-1.737 1.362-2.465a7.3 7.3 0 012.527-1.973 7.1 7.1 0 012.05-.617 7 7 0 011.29-.072 7.2 7.2 0 012.479.537c.012.005.026.01.028.025.001.02-.016.026-.03.032l-.27.105q-.883.343-1.722.783a11.4 11.4 0 00-1.769 1.134c-.48.382-.919.806-1.275 1.315a3.4 3.4 0 00-.532 1.12c-.132.518-.1 1.032.05 1.541.11.377.276.73.459 1.073.231.435.493.851.734 1.28.219.39.423.788.558 1.219.093.3.15.609.143.925a2.6 2.6 0 01-.309 1.176c-.227.438-.538.807-.885 1.147-.32.314-.668.591-1.027.855-.053.04-.094.038-.149.01a7.4 7.4 0 01-1.458-.977 7.5 7.5 0 01-1.4-1.598A7.63 7.63 0 014.5 12.093" }), /* @__PURE__ */ React.createElement("path", { d: "M9.035 18.93c.014-.032.047-.033.073-.042q.787-.287 1.545-.642a14 14 0 001.715-.948q.64-.417 1.2-.938c.366-.345.69-.723.942-1.158.204-.352.342-.728.387-1.134a2.9 2.9 0 00-.103-1.097 5.4 5.4 0 00-.487-1.127c-.237-.433-.506-.848-.754-1.274a7 7 0 01-.55-1.126 2.85 2.85 0 01-.178-1.191c.02-.278.092-.545.204-.801.168-.386.41-.723.691-1.033.411-.455.889-.833 1.387-1.188.055-.04.1-.044.161-.014.53.266 1.025.582 1.482.958a7.6 7.6 0 011.244 1.3 7.4 7.4 0 011.48 3.924c.016.236.031.472.024.71a7.7 7.7 0 01-.324 2.034 7.5 7.5 0 01-2.08 3.319 7.65 7.65 0 01-7.985 1.514c-.027-.012-.059-.015-.074-.045" }));
}
SIN.DefaultColor = DefaultColor;
var SIN_default = SIN;
//# sourceMappingURL=SIN.js.map
