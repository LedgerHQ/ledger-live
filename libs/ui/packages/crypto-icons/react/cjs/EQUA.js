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
var EQUA_exports = {};
__export(EQUA_exports, {
  default: () => EQUA_default
});
module.exports = __toCommonJS(EQUA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f68922";
function EQUA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.54 7.559s-3.095.454-3.546 3.894c0 0-.479 3.85 3.456 4.89.272.072.553.108.835.108h.193c.4 0 .785.16 1.068.445s.443.672.443 1.076a1.51 1.51 0 01-1.392 1.516c-1.935.13-4.53-.819-6.215-3.102 0 0-3.3-4.744.296-9.103a7.63 7.63 0 013.208-2.304c1.478-.552 3.642-.908 5.52.567 0 0 2.516 1.948 1.226 5.128 0 0-.903 2.531-3.997 2.726l-.43-.024a1.42 1.42 0 01-1.338-1.057 1.44 1.44 0 01.433-1.453c.25-.22.567-.346.898-.357l.437-.03s1.483-.064 1.354-1.817c0 0-.13-1.558-2.45-1.103" }));
}
EQUA.DefaultColor = DefaultColor;
var EQUA_default = EQUA;
//# sourceMappingURL=EQUA.js.map
