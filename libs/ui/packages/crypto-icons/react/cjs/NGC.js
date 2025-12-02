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
var NGC_exports = {};
__export(NGC_exports, {
  default: () => NGC_default
});
module.exports = __toCommonJS(NGC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f80000";
function NGC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15 12.632L9.978 19.5l.185-5.58H9l.476-4.9 5.313-.732-1.745 4.444zm-4.123 4.873v-1.312a.18.18 0 00-.185-.178.18.18 0 00-.185.177v1.313a.18.18 0 00.185.177.18.18 0 00.184-.177m-1.375-3.964h1.058l-.049 2.02c0 .053.02.104.06.142s.092.06.147.06h.01a.203.203 0 00.206-.194l.048-2.383H9.925l.354-3.914a.16.16 0 00-.044-.123.17.17 0 00-.125-.053h-.03a.167.167 0 00-.17.148zm0-4.95l1.957-1.616c.104-1.616-.953-1.869-.953-1.869l.159-.606c1.745.505 1.48 2.424 1.48 2.424l2.538 1.06z" }));
}
NGC.DefaultColor = DefaultColor;
var NGC_default = NGC;
//# sourceMappingURL=NGC.js.map
