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
var HTON1_exports = {};
__export(HTON1_exports, {
  default: () => HTON1_default
});
module.exports = __toCommonJS(HTON1_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function HTON1({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M4.384 8.72c-.954-1.733.3-3.855 2.279-3.855h10.93c1.978 0 3.232 2.122 2.278 3.856l-6.247 11.355c-.649 1.18-2.344 1.18-2.993 0zm2.279-2.895a1.64 1.64 0 00-1.438 2.433l6.247 11.355a.8.8 0 00.175.215V5.825zm5.944 0v5.399c.56-.584 1.39-1.082 2.599-1.097.508-.007.935.101 1.283.306.348.204.59.49.75.796q.039.075.073.153l1.718-3.124a1.64 1.64 0 00-1.438-2.433zm3.96 6.91c.028-.316-.006-.732-.178-1.06a1 1 0 00-.387-.415c-.172-.101-.42-.178-.784-.173-1.613.02-2.325 1.187-2.61 1.886v6.855a.8.8 0 00.175-.215z", clipRule: "evenodd" }));
}
HTON1.DefaultColor = DefaultColor;
var HTON1_default = HTON1;
//# sourceMappingURL=HTON1.js.map
