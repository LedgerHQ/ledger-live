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
var SUB_exports = {};
__export(SUB_exports, {
  default: () => SUB_default
});
module.exports = __toCommonJS(SUB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#e53431";
function SUB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.93 3.94a.19.19 0 01.225 0l.942.706a.187.187 0 11-.226.3l-.83-.62L6.345 6.35l11.85 8.89a.188.188 0 010 .303l-.87.652a.188.188 0 01-.226-.301l.67-.503-11.85-8.889a.186.186 0 010-.3zm3.012 0a.185.185 0 01.225-.002l6.026 4.52a.185.185 0 01.065.21.19.19 0 01-.178.129h-3.013a.2.2 0 01-.112-.038L11 5.794a.188.188 0 11.226-.302L15.13 8.42h2.384l-5.46-4.095-3.78 2.835a.188.188 0 01-.225-.301zM6.75 7.836a.189.189 0 01.225.302l-.63.472 11.85 8.89a.187.187 0 010 .302l-3.013 2.26a.19.19 0 01-.225 0l-.872-.654a.19.19 0 01.227-.302l.758.568 2.7-2.025L5.915 8.761a.19.19 0 010-.302l.833-.622zM6.03 15.2v.002h3.012q.062 0 .113.037l3.912 2.934a.188.188 0 01-.225.301L8.98 15.58H6.595l5.461 4.095 3.773-2.83a.189.189 0 11.226.302l-3.886 2.913a.19.19 0 01-.225 0l-6.028-4.52a.188.188 0 11.114-.34" }));
}
SUB.DefaultColor = DefaultColor;
var SUB_default = SUB;
//# sourceMappingURL=SUB.js.map
