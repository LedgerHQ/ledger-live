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
var GEMSTON_exports = {};
__export(GEMSTON_exports, {
  default: () => GEMSTON_default
});
module.exports = __toCommonJS(GEMSTON_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function GEMSTON({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M17.348 4.715l-.047-.048zm0 0l3.456 4.032a.5.5 0 01.013.635l-8.23 10.435a.503.503 0 01-.657.121.5.5 0 01-.132-.117L3.45 9.408a.5.5 0 01.016-.645L7.065 4.71a.5.5 0 01.476-.16m-.303 1.47l.853 2.576H4.952zM4.882 9.597h3.54l2.44 7.458zm8.668 7.386l5.843-7.41h-3.407zm.995-8.406l-2.35-2.762L9.86 8.592zm.885-.503L13.274 5.54h3zm.888.5l.845-2.537 2.174 2.536zm.719-4.028l-.07-.005H7.444m9.594.005a.5.5 0 01.264.122m-6.182.873H8.132l.845 2.55zM9.473 9.594l5.46-.02-2.74 8.334z", clipRule: "evenodd" }));
}
GEMSTON.DefaultColor = DefaultColor;
var GEMSTON_default = GEMSTON;
//# sourceMappingURL=GEMSTON.js.map
