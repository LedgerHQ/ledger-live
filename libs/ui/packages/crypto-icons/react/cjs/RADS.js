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
var RADS_exports = {};
__export(RADS_exports, {
  default: () => RADS_default
});
module.exports = __toCommonJS(RADS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function RADS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.603 5.746a2.856 2.856 0 110 5.712 2.856 2.856 0 010-5.712m2.855 9.652a2.857 2.857 0 11-2.856-2.856 3.94 3.94 0 003.94-3.94 2.856 2.856 0 112.856 2.857 3.94 3.94 0 00-3.94 3.94m3.94 2.856a2.856 2.856 0 110-5.712 2.856 2.856 0 010 5.712m0-1.995a.861.861 0 100-1.722.861.861 0 000 1.722m-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722m6.795-6.796a.86.86 0 100-1.722.86.86 0 000 1.722m-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722" }), /* @__PURE__ */ React.createElement("path", { d: "M8.603 5.746a2.856 2.856 0 110 5.712 2.856 2.856 0 010-5.712m2.855 9.652a2.856 2.856 0 11-2.856-2.856 3.94 3.94 0 003.94-3.94 2.855 2.855 0 112.856 2.857 3.94 3.94 0 00-3.94 3.94m3.94 2.856a2.856 2.856 0 110-5.712 2.856 2.856 0 010 5.712m0-1.995a.861.861 0 100-1.723.861.861 0 000 1.723m-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722m6.795-6.796a.861.861 0 100-1.723.861.861 0 000 1.723m-6.795 0a.861.861 0 100-1.722.861.861 0 000 1.722" }));
}
RADS.DefaultColor = DefaultColor;
var RADS_default = RADS;
//# sourceMappingURL=RADS.js.map
