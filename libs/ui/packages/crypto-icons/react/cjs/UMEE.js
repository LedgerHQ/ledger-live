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
var UMEE_exports = {};
__export(UMEE_exports, {
  default: () => UMEE_default
});
module.exports = __toCommonJS(UMEE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#d7b3ff";
function UMEE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 826 826", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M79.578 177.113v206.744l.064-8.202c1.383 176.672 149.979 327.694 333.147 327.694s331.764-142.822 333.146-319.492l.064-8.202V177.113s-46.209-22.543-98.777 31.214c-33.753 34.514-60.736 158.5-132.996 159.618-96.499 1.493-162.161-126.734-240.675-174.647-34.849-21.267-75.113-27.383-109.889-27.383-47.064-.001-84.084 11.198-84.084 11.198" }), /* @__PURE__ */ React.createElement("path", { d: "M79.333 256.88v147.371l.064-8.773C80.78 584.464 229.432 746.01 412.666 746.01c183.236 0 331.887-152.774 333.27-341.759l.064-8.773V260.651c-18.811 3.135-41.968 12.316-66.423 34.88-37.856 34.929-68.117 160.404-149.16 161.533-108.227 1.511-181.871-128.254-269.925-176.741-39.083-21.521-84.219-27.709-123.208-27.711-22.006 0-42.05 1.971-57.951 4.268" }), /* @__PURE__ */ React.createElement("path", { d: "M79.333 358.466v45.785l.064-8.773C80.78 584.464 229.432 746.01 412.666 746.01c183.236 0 331.887-152.774 333.27-341.759l.064-8.773v-23.795c-14.41 5.487-30.103 14.297-46.316 28.196-40.751 34.929-73.327 160.404-160.567 161.535-116.501 1.509-195.779-128.256-290.568-176.744-42.065-21.518-90.647-27.703-132.62-27.703-12.957-.001-25.283.589-36.596 1.499" }));
}
UMEE.DefaultColor = DefaultColor;
var UMEE_default = UMEE;
//# sourceMappingURL=UMEE.js.map
