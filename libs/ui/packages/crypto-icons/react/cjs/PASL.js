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
var PASL_exports = {};
__export(PASL_exports, {
  default: () => PASL_default
});
module.exports = __toCommonJS(PASL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00acff";
function PASL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M11.31 15.117a.383.383 0 01.501.21.386.386 0 01-.208.502L9.05 16.89l-.34 1.86H6.953l.192-1.07-1.036.43a.38.38 0 01-.501-.209.386.386 0 01.208-.503l1.492-.619.113-.63-2.016.837a.383.383 0 01-.5-.504.4.4 0 01.208-.209l2.47-1.025 1.798-9.99h5.08q4.665-.162 4.665 3.116c0 2.771-2.026 4.915-5.464 4.915H9.705l-.212 1.167 1.115-.463a.38.38 0 01.5.209.386.386 0 01-.208.502l-1.572.654-.115.63zm-.428-8.285l-.878 4.818h3.913c2.409 0 3.323-1.638 3.323-2.827 0-1.188-.575-1.991-2.492-1.991z", clipRule: "evenodd" }));
}
PASL.DefaultColor = DefaultColor;
var PASL_default = PASL;
//# sourceMappingURL=PASL.js.map
