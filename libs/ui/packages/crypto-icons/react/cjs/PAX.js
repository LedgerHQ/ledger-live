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
var PAX_exports = {};
__export(PAX_exports, {
  default: () => PAX_default
});
module.exports = __toCommonJS(PAX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ede708";
function PAX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M19.587 9.973l.375.563c.75-1.89.577-3.368-.098-4.013-1.215-1.17-3-.517-4.935-1.327-1.612-1.185-2.587-1.5-3.93-1.5a4.67 4.67 0 00-2.437 1.23 3.75 3.75 0 00-2.925 1.147c-.795.938-.975 3.51-1.095 4.163-.12.652-1.5 3.285-1.358 4.725.143 1.44 1.2 3 4.193 3.367a5.69 5.69 0 004.5 1.973c1.567-.165 3.75-2.565 5.017-3.518s5.783-1.777 3.09-6.21a7 7 0 00-.375-.562zm-6.848 6.6a4.995 4.995 0 01-5.587-3.045c-.165-.645-.488-3.93 2.25-5.557 2.04-1.155 4.912-1.313 6.12 1.38 1.207 2.692.765 6.465-2.783 7.222" }));
}
PAX.DefaultColor = DefaultColor;
var PAX_default = PAX;
//# sourceMappingURL=PAX.js.map
