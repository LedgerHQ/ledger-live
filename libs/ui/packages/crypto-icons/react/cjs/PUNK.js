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
var PUNK_exports = {};
__export(PUNK_exports, {
  default: () => PUNK_default
});
module.exports = __toCommonJS(PUNK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function PUNK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.137 4.084a7.953 7.953 0 100 15.905 7.953 7.953 0 000-15.905m-8.953 7.952a8.953 8.953 0 1117.906 0 8.953 8.953 0 01-17.906 0", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M10.248 7.268H8.145V9.81H6.828v1.225h1.317v1.317H6.828v1.225h1.317v2.47h1.28v1.244h5.688v-1.244h1.28v-8.78H14.29v7.628h-4.042v-1.318h1.244v-1.225h-1.244v-1.317h1.244V9.81h-1.244z" }));
}
PUNK.DefaultColor = DefaultColor;
var PUNK_default = PUNK;
//# sourceMappingURL=PUNK.js.map
