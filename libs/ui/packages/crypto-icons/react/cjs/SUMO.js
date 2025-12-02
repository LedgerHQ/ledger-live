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
var SUMO_exports = {};
__export(SUMO_exports, {
  default: () => SUMO_default
});
module.exports = __toCommonJS(SUMO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2d9cdb";
function SUMO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M13.546 6.813c2.553 2.675 3.2 3.147 3.821 3.317-2.156-.27-3.373-.423-5.405-1.49l-1.282 1.493 8.07 1.792c-2.524 2.146-3.618 3.29-5.204 5.26h-3.053c-1.342-1.963-2.237-2.6-3.96-3.395 2.293.212 3.568.353 5.43 1.455l1.395-1.567-8.108-1.753c1.886-1.554 2.983-2.59 5.242-5.112zM10.68 6.44c.697-.859.982-1.276 1.358-1.94.367.684.651 1.106 1.32 1.94zm2.678 11.12c-.699.859-.985 1.276-1.358 1.94-.367-.684-.652-1.106-1.32-1.94z" }));
}
SUMO.DefaultColor = DefaultColor;
var SUMO_default = SUMO;
//# sourceMappingURL=SUMO.js.map
