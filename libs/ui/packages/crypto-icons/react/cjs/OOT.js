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
var OOT_exports = {};
__export(OOT_exports, {
  default: () => OOT_default
});
module.exports = __toCommonJS(OOT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#25aae1";
function OOT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.26 18.745c-1.23.013-2.263-.209-3.236-.693-.06-.03-.105-.031-.165.003a5.4 5.4 0 01-1.914.646c-.288.038-.579.078-.868.019a1.024 1.024 0 01-.56-1.695c.343-.39.601-.849.757-1.345a.16.16 0 00-.02-.15 6.4 6.4 0 01-.958-2.788c-.22-2.192.461-4.07 2.033-5.608a6.44 6.44 0 013.647-1.803c1.903-.278 3.637.161 5.16 1.34 1.359 1.054 2.205 2.44 2.5 4.134.373 2.144-.168 4.053-1.605 5.685-1.063 1.206-2.413 1.922-4.002 2.177-.301.048-.607.062-.77.078m-4.823-1.791c.05-.014.078-.021.105-.03a4.6 4.6 0 001.196-.613c.264-.186.524-.195.802-.036a4.9 4.9 0 001.923.628c1.116.119 2.168-.093 3.11-.698 1.627-1.044 2.437-2.547 2.349-4.493-.056-1.247-.545-2.323-1.429-3.2-1.066-1.056-2.362-1.537-3.865-1.434-1.012.07-1.927.419-2.706 1.07-1.51 1.26-2.093 2.875-1.758 4.812.11.637.363 1.222.722 1.762a.83.83 0 01.128.674 6 6 0 01-.36 1.087c-.067.153-.139.302-.216.47m4.569-7.81l.427.868c.15.308.305.615.45.926.038.08.088.11.172.12q.945.133 1.888.271l.07.015c-.115.12-.223.237-.337.348q-.532.521-1.07 1.036c-.062.06-.087.116-.07.209.112.632.217 1.266.324 1.9.002.015.002.032.004.062-.034-.013-.06-.021-.085-.034q-.835-.438-1.668-.884c-.075-.04-.133-.044-.211-.002q-.837.445-1.679.885c-.022.013-.046.023-.09.044.028-.17.052-.323.078-.474q.132-.768.27-1.535c.014-.075-.028-.11-.07-.151q-.67-.66-1.343-1.314c-.025-.026-.061-.04-.093-.06l.024-.036.687-.099q.647-.093 1.296-.183c.069-.01.1-.047.129-.105q.424-.865.852-1.728c.01-.02.023-.04.045-.078", clipRule: "evenodd" }));
}
OOT.DefaultColor = DefaultColor;
var OOT_default = OOT;
//# sourceMappingURL=OOT.js.map
