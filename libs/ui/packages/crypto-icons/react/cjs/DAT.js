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
var DAT_exports = {};
__export(DAT_exports, {
  default: () => DAT_default
});
module.exports = __toCommonJS(DAT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2d9cdb";
function DAT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.31 4.464q.443 0 .71.27.27.268.27.71v8.755q0 1.497-.71 2.726a5.16 5.16 0 01-1.901 1.92q-1.19.69-2.67.691-1.477 0-2.707-.69a5.16 5.16 0 01-1.9-1.92q-.691-1.23-.691-2.727t.633-2.707q.652-1.23 1.767-1.92a4.74 4.74 0 012.514-.692 4.73 4.73 0 013.706 1.748V5.444q0-.442.27-.71a1 1 0 01.71-.27m-4.3 13.344q.96 0 1.727-.46a3.35 3.35 0 001.23-1.305 3.86 3.86 0 00.441-1.844q0-1.018-.442-1.824a3.2 3.2 0 00-1.229-1.287 3.2 3.2 0 00-1.728-.48q-.96 0-1.747.48c-.517.312-.94.757-1.229 1.287q-.44.805-.44 1.824 0 1.017.44 1.843a3.56 3.56 0 001.23 1.306q.787.46 1.747.46" }));
}
DAT.DefaultColor = DefaultColor;
var DAT_default = DAT;
//# sourceMappingURL=DAT.js.map
