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
var SAN_exports = {};
__export(SAN_exports, {
  default: () => SAN_default
});
module.exports = __toCommonJS(SAN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2b77b3";
function SAN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.25 12.03c-.035 4.58-3.748 8.254-8.308 8.22-4.564-.034-8.229-3.763-8.192-8.334.037-4.528 3.76-8.196 8.288-8.166 4.56.031 8.245 3.747 8.212 8.28m-15.903-.027c.008 4.215 3.418 7.618 7.642 7.628 4.227.007 7.677-3.419 7.662-7.638-.015-4.395-3.656-7.71-7.846-7.638-4.052.069-7.466 3.513-7.458 7.648m9.664-3.582l-.305.977c-.569-.094-1.095-.206-1.629-.258-.316-.03-.645.052-.767.408-.126.365-.141.754.161 1.036.31.29.675.518 1.016.774.313.236.657.441.93.717.74.747.871 1.653.568 2.63-.18.578-.61.944-1.158 1.166-.84.34-2.27.173-3.074-.367l.352-1.023c.512.135.98.297 1.461.373.46.073.94.002 1.176-.466.237-.473.162-.97-.21-1.35-.286-.292-.645-.515-.98-.759-.224-.162-.474-.29-.691-.459a2.35 2.35 0 01-.716-2.835 1.56 1.56 0 011.102-.923c.941-.223 1.854-.122 2.764.36m-6.06 3.443a.95.95 0 01-.943.952.976.976 0 01-.962-.978.97.97 0 01.971-.933.945.945 0 01.934.959m9.07-.932a.896.896 0 01.92.912.95.95 0 01-.957.972.955.955 0 01-.94-.958c0-.55.398-.926.976-.926" }));
}
SAN.DefaultColor = DefaultColor;
var SAN_default = SAN;
//# sourceMappingURL=SAN.js.map
