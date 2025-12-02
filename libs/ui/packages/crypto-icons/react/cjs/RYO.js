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
var RYO_exports = {};
__export(RYO_exports, {
  default: () => RYO_default
});
module.exports = __toCommonJS(RYO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3d58b0";
function RYO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 3.011c-4.957 0-8.989 4.032-8.989 8.99 0 4.957 4.032 8.988 8.99 8.988 4.957 0 8.988-4.032 8.988-8.988 0-4.958-4.032-8.99-8.988-8.99m0 1.224a7.756 7.756 0 017.765 7.766 7.754 7.754 0 01-7.764 7.765A7.755 7.755 0 014.235 12a7.756 7.756 0 017.766-7.766" }), /* @__PURE__ */ React.createElement("path", { d: "M8.66 8.681v6.638h6.68V8.68zM9.749 9.77h4.503v4.462H9.75z" }));
}
RYO.DefaultColor = DefaultColor;
var RYO_default = RYO;
//# sourceMappingURL=RYO.js.map
