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
var WAX_exports = {};
__export(WAX_exports, {
  default: () => WAX_default
});
module.exports = __toCommonJS(WAX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f89022";
function WAX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M21 13.847h-1.773l-1.258-1.077-1.253 1.072h-1.499l-.716-.87h-2.469l.625-.772h1.214l-.925-1.13L9.719 15H8.22l.934-1.142h-1.56l-.844-2.365-.837 2.348H4.33L3 10.156h1.215l.894 2.51.891-2.5h1.5l.889 2.493.888-2.494h1.219l-1.341 3.692.298-.364 2.739-3.334H13.7l2.279 2.781 1.096-.943L13.605 9h1.781zm-1.759-2.23l-.836-.717.835-.71 1.687.001z", clipRule: "evenodd" }));
}
WAX.DefaultColor = DefaultColor;
var WAX_default = WAX;
//# sourceMappingURL=WAX.js.map
