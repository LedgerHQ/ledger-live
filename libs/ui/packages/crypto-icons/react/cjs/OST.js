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
var OST_exports = {};
__export(OST_exports, {
  default: () => OST_default
});
module.exports = __toCommonJS(OST_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#34445b";
function OST({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.684 8.728l1.507-2.352a1.523 1.523 0 00.623-2.977 1.522 1.522 0 00-1.53 2.4l-1.87 2.918a5.97 5.97 0 00-3.201 10.56 5.974 5.974 0 008.404-.829 5.97 5.97 0 001.327-4.374 5.976 5.976 0 00-5.26-5.346m-.686 9.092a3.165 3.165 0 01-2.928-4.38 3.165 3.165 0 014.729-1.393c.529.366.934.884 1.161 1.487a1.831 1.831 0 00-2.893 2.243 1.83 1.83 0 002.887.005 3.16 3.16 0 01-2.956 2.038" }), /* @__PURE__ */ React.createElement("path", { d: "M12.684 8.728l1.507-2.352a1.523 1.523 0 00.623-2.977 1.522 1.522 0 00-1.53 2.4l-1.87 2.918a5.97 5.97 0 00-3.201 10.56 5.974 5.974 0 008.404-.829 5.97 5.97 0 001.327-4.374 5.976 5.976 0 00-5.26-5.346m-.686 9.092a3.165 3.165 0 01-2.928-4.38 3.165 3.165 0 014.729-1.393c.529.366.934.884 1.161 1.487a1.831 1.831 0 00-2.893 2.243 1.83 1.83 0 002.887.005 3.16 3.16 0 01-2.956 2.038" }));
}
OST.DefaultColor = DefaultColor;
var OST_default = OST;
//# sourceMappingURL=OST.js.map
