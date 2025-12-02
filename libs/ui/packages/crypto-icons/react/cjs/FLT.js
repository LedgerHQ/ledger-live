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
var FLT_exports = {};
__export(FLT_exports, {
  default: () => FLT_default
});
module.exports = __toCommonJS(FLT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function FLT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.641 6.692V4.01H11.42v2.673c-2.7.29-4.8 2.558-4.8 5.318s2.1 5.029 4.8 5.314v2.673h1.222v-2.68c2.67-.316 4.74-2.573 4.74-5.31 0-2.738-2.07-4.996-4.74-5.31zm-1.222 9.401c-2.022-.281-3.578-2.006-3.578-4.091s1.556-3.81 3.578-4.091zm1.222-.008V7.921a4.14 4.14 0 013.514 4.084 4.14 4.14 0 01-3.514 4.084z" }));
}
FLT.DefaultColor = DefaultColor;
var FLT_default = FLT;
//# sourceMappingURL=FLT.js.map
