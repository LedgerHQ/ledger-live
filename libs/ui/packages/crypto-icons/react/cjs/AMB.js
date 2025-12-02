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
var AMB_exports = {};
__export(AMB_exports, {
  default: () => AMB_default
});
module.exports = __toCommonJS(AMB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3c5be0";
function AMB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M20.25 12.011v.006a.4.4 0 01-.047.171c-.105.191-2.619 4.687-8.202 4.687s-8.099-4.495-8.203-4.687a.4.4 0 01-.048-.17v-.052a.4.4 0 01.041-.141l.002-.003.004-.01c.105-.191 2.62-4.687 8.203-4.687 5.584 0 8.098 4.496 8.202 4.688l.004.008.003.004a.4.4 0 01.04.141v.035zM19.418 12c-.423-.655-2.01-2.845-4.887-3.725a4.55 4.55 0 011.828 2.722.445.445 0 01.343.428.438.438 0 01-.826.222.45.45 0 01.088-.543c-.37-1.667-1.741-2.955-3.43-3.18l-.038-.008a9 9 0 00-.993 0l-.038.008a4 4 0 00-1.822.728.204.204 0 01-.312-.233.2.2 0 01.075-.103l.054-.039C6.589 9.16 5.004 11.345 4.583 12c.418.65 1.98 2.805 4.808 3.701a4.53 4.53 0 01-1.781-2.827.45.45 0 01-.285-.47.444.444 0 01.38-.393.44.44 0 01.469.282.45.45 0 01-.16.527 4.08 4.08 0 003.25 3.248c.49.04.985.04 1.476 0a4 4 0 001.683-.744.2.2 0 01.204-.026.21.21 0 01.04.358l-.066.049C17.434 14.81 19 12.651 19.418 12m-3.803.013c0 2.023-1.622 3.669-3.615 3.669s-3.615-1.646-3.615-3.67c0-2.022 1.622-3.668 3.615-3.668s3.615 1.645 3.615 3.669m-.408 0c0-1.794-1.439-3.254-3.207-3.254s-3.208 1.459-3.208 3.255 1.44 3.253 3.208 3.253 3.207-1.46 3.207-3.254m-2.025-1.008c0 .393-.194.76-.518.975l.323 1.97a.236.236 0 01-.238.285h-1.44a.236.236 0 01-.238-.284l.32-1.97a1.18 1.18 0 01-.429-1.421c.21-.517.75-.81 1.29-.703.54.109.93.59.93 1.149m3.26 1.533a4.53 4.53 0 01-1.132 2.526.202.202 0 01-.347-.075.21.21 0 01.045-.204 4.1 4.1 0 001.03-2.295.206.206 0 01.225-.182.207.207 0 01.18.23M9.04 8.887a.21.21 0 01.007.292 4.1 4.1 0 00-1.067 2.228.206.206 0 01-.233.173.207.207 0 01-.171-.235 4.53 4.53 0 011.175-2.45.203.203 0 01.289-.008" }));
}
AMB.DefaultColor = DefaultColor;
var AMB_default = AMB;
//# sourceMappingURL=AMB.js.map
