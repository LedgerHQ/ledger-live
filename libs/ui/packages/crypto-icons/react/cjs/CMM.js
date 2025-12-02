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
var CMM_exports = {};
__export(CMM_exports, {
  default: () => CMM_default
});
module.exports = __toCommonJS(CMM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2fd2e5";
function CMM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.8 3.116a8.84 8.84 0 00-5.635 1.78 1.324 1.324 0 00-.082 2.05 1.3 1.3 0 001.692.08 6.29 6.29 0 018.47.683c.443.458.456 1.179.032 1.653a1.19 1.19 0 01-1.684.058l-.058-.058a3.928 3.928 0 100 5.294 1.168 1.168 0 011.81.081 1.184 1.184 0 01-.068 1.507 6.31 6.31 0 01-8.505.747 1.324 1.324 0 00-1.703.082 1.34 1.34 0 00.112 2.067A8.889 8.889 0 1010.8 3.117m-.166 11.091a2.2 2.2 0 11.016-4.401 2.2 2.2 0 01-.015 4.401" }));
}
CMM.DefaultColor = DefaultColor;
var CMM_default = CMM;
//# sourceMappingURL=CMM.js.map
