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
var CHIPS_exports = {};
__export(CHIPS_exports, {
  default: () => CHIPS_default
});
module.exports = __toCommonJS(CHIPS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#598182";
function CHIPS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M10.911 19.055l1.902-2.457c.712.11 1.413.048 2.084-.243.242-.105.459-.269.687-.407.032-.02.062-.045.087-.064l2.304 2.279c-.192.127-.381.265-.583.384a7 7 0 01-2.534.877 8 8 0 01-1.592.06 9 9 0 01-2.355-.429m-.724-.282a8 8 0 01-.747-.385 6.7 6.7 0 01-2.783-3.113 7.5 7.5 0 01-.59-2.145 9 9 0 01-.047-1.73c.093-1.482.543-2.843 1.452-4.04.838-1.106 1.94-1.863 3.242-2.348a7.3 7.3 0 011.924-.443c.497-.043 1-.085 1.497-.064q.461.02.907.09l-1.929 2.8a4 4 0 00-1.807.613c-.998.633-1.595 1.545-1.875 2.67a5.4 5.4 0 00-.162 1.45q.009.386.066.753l-.23.336c-.187.27.042.627.373.583l.084-.01a4.7 4.7 0 00.893 1.526q.378.435.842.727l-1.083 2.619a.4.4 0 00-.027.112M15.769 4.75a6.1 6.1 0 011.872.856c.104.07.198.153.297.23q.027.021.062.044c-.031.036-.05.06-.071.081q-1.026 1.01-2.049 2.02c-.075.076-.122.088-.213.023a3.2 3.2 0 00-.9-.447l.962-2.531.025-.065a.37.37 0 00.015-.211m-2.778 8.21l-3.565.467 5.931-8.613.033.015-2.291 6.024 4.181-.66-6.674 8.632-.032-.022z", clipRule: "evenodd" }));
}
CHIPS.DefaultColor = DefaultColor;
var CHIPS_default = CHIPS;
//# sourceMappingURL=CHIPS.js.map
