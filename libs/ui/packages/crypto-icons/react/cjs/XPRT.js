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
var XPRT_exports = {};
__export(XPRT_exports, {
  default: () => XPRT_default
});
module.exports = __toCommonJS(XPRT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#e50913";
function XPRT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 512 512", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M345.171 132.464h-171V170h171z" }), /* @__PURE__ */ React.createElement("path", { d: "M348.443 265.394q0 19.844-9.109 36.435-9.108 16.266-27.977 26.351-18.868 10.085-46.846 10.085h-34.483v81.98h-55.63V191.872h90.113q27.327 0 46.195 9.434 18.868 9.435 28.303 26.026 9.434 16.59 9.434 38.062m-88.161 28.628q15.94 0 23.748-7.483t7.808-21.145q0-13.664-7.808-21.146t-23.748-7.482h-30.254v57.256z" }));
}
XPRT.DefaultColor = DefaultColor;
var XPRT_default = XPRT;
//# sourceMappingURL=XPRT.js.map
