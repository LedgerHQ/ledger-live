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
var ELIX_exports = {};
__export(ELIX_exports, {
  default: () => ELIX_default
});
module.exports = __toCommonJS(ELIX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function ELIX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.573 17.702l.001-.003 2.391-5.712-2.392-5.711 4.413 5.711-4.41 5.711zm8.832 0l-.003-.004-4.411-5.71 4.414-5.712-2.393 5.711 2.391 5.712z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.8, d: "M11.989 11.988v3.98L7.57 17.7l4.418-5.715v-3.98l4.417-1.732z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M11.989 15.968v3.488L7.57 17.698l4.418-1.737v-3.973L7.57 6.273l4.418 1.732V4.517l4.417 1.757-4.417 1.737v3.974l4.417 5.715z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.145, d: "M7.571 6.274l4.418-1.757v3.494zm8.835 11.424l-4.417 1.758V15.96z" }), /* @__PURE__ */ React.createElement("path", { d: "M7.584 17.716l.001-.003L9.976 12 7.584 6.289l4.414 5.712-4.411 5.711zm8.832 0l-.003-.004-4.41-5.711 4.413-5.712-2.392 5.712 2.39 5.712z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.8, d: "M12 12.002v3.979l-4.418 1.733L12 11.999v-3.98l4.418-1.732z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.5, d: "M12 15.981v3.488l-4.418-1.758L12 15.975v-3.973L7.582 6.287 12 8.019V4.531l4.418 1.757L12 8.024V12l4.418 5.714z" }), /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.1, d: "M7.582 6.288L12 4.531v3.493zm8.836 11.423L12 19.47v-3.494z" }));
}
ELIX.DefaultColor = DefaultColor;
var ELIX_default = ELIX;
//# sourceMappingURL=ELIX.js.map
