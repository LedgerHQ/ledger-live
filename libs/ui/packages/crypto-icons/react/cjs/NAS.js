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
var NAS_exports = {};
__export(NAS_exports, {
  default: () => NAS_default
});
module.exports = __toCommonJS(NAS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#222";
function NAS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M9.548 13.991l2.359 4.787 1.212-3.58zm-4.315-2.076l3.573 1.212 1.213-3.577zm4.523 1.518c.056.03.08.047.106.056 1.152.392 2.302.786 3.457 1.168.094.03.227.005.32-.04q1.98-.969 3.954-1.947c.375-.185.749-.372 1.158-.576-.09-.035-.137-.054-.186-.07-1.115-.38-2.23-.76-3.349-1.129a.52.52 0 00-.358.023c-1.404.682-2.802 1.376-4.202 2.067zm4.874-3.05c-.847-1.72-1.684-3.415-2.542-5.155l-2.61 7.7zm-10.88 1.62c.82-.406 1.595-.792 2.37-1.174q1.978-.977 3.958-1.947a.49.49 0 00.273-.31c.516-1.54 1.04-3.077 1.561-4.615.02-.057.043-.112.079-.206.053.102.091.174.127.247 1.01 2.047 2.016 4.095 3.034 6.138.049.099.18.181.291.22 1.527.526 3.057 1.043 4.586 1.563l.221.078c-.141.072-.245.126-.35.178-1.971.973-3.941 1.948-5.915 2.914a.66.66 0 00-.37.424c-.51 1.525-1.031 3.046-1.55 4.569-.014.041-.031.082-.065.169-.133-.266-.248-.494-.36-.721q-1.379-2.792-2.75-5.588a.54.54 0 00-.34-.304c-1.532-.512-3.06-1.035-4.59-1.555-.055-.019-.11-.042-.21-.08", clipRule: "evenodd" }));
}
NAS.DefaultColor = DefaultColor;
var NAS_default = NAS;
//# sourceMappingURL=NAS.js.map
