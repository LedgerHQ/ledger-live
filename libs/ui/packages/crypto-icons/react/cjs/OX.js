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
var OX_exports = {};
__export(OX_exports, {
  default: () => OX_default
});
module.exports = __toCommonJS(OX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4392cd";
function OX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.644 18.75h-1.287c-.966 0-1.24-.895-1.24-1.58 0-.683.048-.993.048-1.302 0-.487-.245-1.705-.692-2.215-.869-.993-1.417-1.884-1.417-3.175-.755-.39-2.092-.75-2.606-1.335-.515-.586-.95-1.418-.95-2.607q0-.456.194-1.286.444 1.388 1.367 1.905c.901.505 1.917.88 2.784.88h6.31c.867 0 1.882-.376 2.784-.88q.922-.517 1.367-1.905.194.83.194 1.286c0 1.189-.435 2.02-.95 2.605-.514.586-1.85.945-2.607 1.335 0 1.293-.547 2.183-1.416 3.177-.446.51-.692 1.727-.692 2.214 0 .31.048.62.048 1.303 0 .684-.273 1.58-1.24 1.58", clipRule: "evenodd" }));
}
OX.DefaultColor = DefaultColor;
var OX_default = OX;
//# sourceMappingURL=OX.js.map
