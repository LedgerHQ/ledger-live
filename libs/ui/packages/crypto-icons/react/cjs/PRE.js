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
var PRE_exports = {};
__export(PRE_exports, {
  default: () => PRE_default
});
module.exports = __toCommonJS(PRE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function PRE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.103 13.534h1.258c.36 0 .715-.078 1.04-.231.308-.153.582-.363.808-.621a2.9 2.9 0 00.513-.901c.124-.333.188-.686.186-1.041a2.5 2.5 0 00-.202-1.01 3.1 3.1 0 00-.543-.885 2.7 2.7 0 00-.824-.636 2.2 2.2 0 00-1.038-.248H7.994v8.027h2.111zm0-3.635h1.07c.149.01.288.077.388.187.125.124.203.342.203.683s-.077.544-.188.654a.48.48 0 01-.356.186h-1.118V9.9" }), /* @__PURE__ */ React.createElement("path", { d: "M5.267 6.023v11.916c0 .427.346.772.773.772h11.916a.77.77 0 00.772-.772V6.023a.77.77 0 00-.772-.774H6.04a.77.77 0 00-.773.773M16.37 17.126H7.61a.77.77 0 01-.774-.773v-8.76a.773.773 0 01.773-.773h8.76c.428 0 .773.345.773.772v8.76a.77.77 0 01-.773.773" }), /* @__PURE__ */ React.createElement("path", { d: "M11.05 14.482h4.955v1.522H11.05z" }), /* @__PURE__ */ React.createElement("path", { d: "M10.105 13.554h1.258c.36 0 .715-.078 1.04-.231.308-.153.582-.363.808-.621.224-.267.398-.573.513-.901a3 3 0 00.186-1.041 2.5 2.5 0 00-.202-1.01 3.1 3.1 0 00-.543-.885 2.7 2.7 0 00-.824-.636 2.2 2.2 0 00-1.038-.249H7.996v8.028h2.112zm0-3.635h1.07c.149.01.288.077.388.187.125.124.203.342.203.683s-.077.544-.187.654a.48.48 0 01-.357.186h-1.117z" }), /* @__PURE__ */ React.createElement("path", { d: "M5.27 6.042v11.916c0 .428.345.773.772.773h11.916a.77.77 0 00.773-.773V6.042a.77.77 0 00-.773-.773H6.042a.77.77 0 00-.773.773m11.102 11.103h-8.76a.77.77 0 01-.774-.772v-8.76a.773.773 0 01.774-.773h8.76c.427 0 .772.345.772.772v8.76a.77.77 0 01-.772.773" }), /* @__PURE__ */ React.createElement("path", { d: "M11.052 14.502h4.955v1.522h-4.955z" }));
}
PRE.DefaultColor = DefaultColor;
var PRE_default = PRE;
//# sourceMappingURL=PRE.js.map
