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
var STQ_exports = {};
__export(STQ_exports, {
  default: () => STQ_default
});
module.exports = __toCommonJS(STQ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2dc4e7";
function STQ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M4.615 6.09c.803 0 1.633-.055 2.437.017.357.401.438.964.714 1.428 3.608.018 7.233 0 10.84 0 .268.018.598.027.732.295.16.295.045.643-.107.91-.732 1.242-1.429 2.5-2.143 3.75-.268.447-.447.947-.848 1.296-.33.276-.786.294-1.205.294h-5.001c-.268 0-.554-.027-.714-.241-.518-.58-.795-1.322-1.134-2a185 185 0 01-1.724-3.545c-.116-.268-.259-.508-.393-.759-.472 0-.946 0-1.41-.018a5 5 0 01-.045-1.428m5.634 8.954a2.6 2.6 0 011.107-.018c.41.09.768.402.866.813.107.473.107.983-.08 1.437-.18.411-.626.608-1.045.644-.482.035-1.036 0-1.393-.358-.384-.428-.384-1.053-.303-1.59.053-.446.41-.83.847-.928m4.464 0c.446-.097.928-.09 1.357.071.41.17.625.617.66 1.036.054.491 0 1.054-.357 1.429-.33.313-.812.357-1.25.348-.428-.017-.892-.179-1.115-.58a2.1 2.1 0 01-.161-1.402c.09-.438.429-.803.866-.902" }));
}
STQ.DefaultColor = DefaultColor;
var STQ_default = STQ;
//# sourceMappingURL=STQ.js.map
