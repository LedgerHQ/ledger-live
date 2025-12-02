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
var GSWIFT_exports = {};
__export(GSWIFT_exports, {
  default: () => GSWIFT_default
});
module.exports = __toCommonJS(GSWIFT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function GSWIFT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, fill: color, viewBox: "0 0 460 450" }, /* @__PURE__ */ React.createElement("path", { d: "M118.5 68C94.9 91.6 75.8 111.1 76 111.3c.3.2 17.6 7.4 38.5 16.1l38 15.7-35 35.2c-19.2 19.4-48.5 48.8-65 65.5l-30 30.3 7-2.9c3.9-1.6 53.4-22.3 110.2-46.1C196.4 201.4 243.4 182 244 182c.7 0 44.9 18.3 98.4 40.6 53.4 22.4 103 43.1 110.1 46.1l13 5.4-65-65c-40-40.1-64.6-65.4-64-66 .6-.5 17-7.5 36.5-15.6s36.3-15.2 37.4-15.7c1.6-.9-3.5-6.4-41-43.9L326.5 25h-165zm218.7 8.7c12.6 12.5 22.8 23.2 22.8 23.8 0 .5-10.5 5.3-23.3 10.6l-23.2 9.6-10.6-9.9-10.7-9.8-51.7.2-51.7.3 34.1 14.2L257 130h23.5l30 30.1c16.5 16.6 29.3 29.9 28.5 29.6s-23.1-9.6-49.5-20.7-72.3-30.3-102-42.7-55.5-23.2-57.4-24l-3.4-1.5 23.4-23.4L173.5 54h141zm-143.1 83.9c6.1 2.6 10.7 5 10.2 5.4-.6.5-36.1 15.7-53.3 22.7-2.7 1.1.2-2.2 13.5-15.6 9.3-9.4 17.3-17.1 17.8-17.1.4 0 5.7 2.1 11.8 4.6" }));
}
GSWIFT.DefaultColor = DefaultColor;
var GSWIFT_default = GSWIFT;
//# sourceMappingURL=GSWIFT.js.map
