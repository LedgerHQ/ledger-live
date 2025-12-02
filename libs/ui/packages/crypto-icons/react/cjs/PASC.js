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
var PASC_exports = {};
__export(PASC_exports, {
  default: () => PASC_default
});
module.exports = __toCommonJS(PASC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f7931e";
function PASC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 3a9 9 0 100 18 9 9 0 000-18m4.5 4.36a1.687 1.687 0 011.688 1.687v2.53a1.687 1.687 0 01-1.688 1.688h-2.09l-.135.633a.366.366 0 01-.34.282h-.422a.22.22 0 01-.222-.282l.136-.632h-.985l-.135.632a.366.366 0 01-.34.282h-.423a.22.22 0 01-.221-.282l.135-.632h-1.056l-.926 4.359h-2.25L8.87 9.89h2.25l-.359 1.688h4.333a.843.843 0 00.844-.843V9.89a.844.844 0 00-.844-.843H5.813L7.219 7.36h5.494l.135-.633a.366.366 0 01.34-.282h.422a.22.22 0 01.222.282l-.135.633h.985l.134-.633a.366.366 0 01.34-.282h.423a.22.22 0 01.221.282l-.134.633z" }));
}
PASC.DefaultColor = DefaultColor;
var PASC_default = PASC;
//# sourceMappingURL=PASC.js.map
