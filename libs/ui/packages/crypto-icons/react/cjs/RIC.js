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
var RIC_exports = {};
__export(RIC_exports, {
  default: () => RIC_default
});
module.exports = __toCommonJS(RIC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#60e4dd";
function RIC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M6.858 15.393q.337-.51.639-.96H5.199a.07.07 0 01-.07-.07v-.477a.07.07 0 01.07-.07h2.717c1.452-2.121 2.178-2.995 2.178-3.084 0-.137-.03-.206-.525-.206-.978 0-2.587-.698-2.587-2.604 0-1.038 1.678-2.297 2.658-2.297.454 0 .524.193.315.205-.56.035-1.784 1.152-1.784 2.228 0 .72.64 1.954 2.063 1.954 1.681 0 3.117-2.673 6.609-2.673 2.098 0 2.657 1.64 2.657 2.09s-.655.686-1.538.686c-.884 0-.917-1.577-2.693-1.577-2.788 0-5.163 3.02-6.303 5.278h1.968a.07.07 0 01.07.07v.477a.07.07 0 01-.02.05.07.07 0 01-.05.02H8.676a7 7 0 00-.345.96h1.973c.038 0 .07.03.07.07v.478a.07.07 0 01-.07.07H8.242q.055 1.311 2.202 2.364h-5.49q.74-1.19 1.5-2.365H4.572a.07.07 0 01-.07-.07v-.477a.07.07 0 01.069-.07z", clipRule: "evenodd" }));
}
RIC.DefaultColor = DefaultColor;
var RIC_default = RIC;
//# sourceMappingURL=RIC.js.map
