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
var BCD_exports = {};
__export(BCD_exports, {
  default: () => BCD_default
});
module.exports = __toCommonJS(BCD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fcc339";
function BCD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M16.939 6.896l.058.128-2.291 1.051 1.03 3.413 3.391-1.713.045.09.014-.017-2.197-2.93zm-.124-.058l-2.08-.968H9.357L7.136 6.89l2.31.972h5.137zm-9.865.24l-2.08 2.7 3.385 1.71L9.29 8.064zm2.58 1.03l-1.07 3.54 3.535 6.249 3.536-6.25-1.07-3.54zm9.384 2.05l-3.164 1.598-3.154 5.574zM11.378 17.3l-3.136-5.545-3.147-1.589zM4.823 9.857l.025-.05-.032.042zm2.093-3.135l2.388-1.097h5.484l2.358 1.096 2.354 3.14-7.5 8.514L4.5 9.86zm6.901 4.029c.044.455-.144.729-.445.884.495.12.806.418.745 1.087-.076.83-.687 1.052-1.56 1.103v.872h-.519v-.86q-.202 0-.415-.005v.865h-.518v-.874q-.182-.003-.371-.004h-.675l.103-.627s.384.006.377 0c.147 0 .186-.107.195-.174V11.64h.056l-.056-.004v-.983c-.02-.107-.088-.23-.299-.231.007-.008-.376 0-.376 0v-.561h.716v.003q.16 0 .33-.005v-.863h.52v.847q.207-.005.413-.006v-.84h.52v.863c.67.06 1.2.268 1.26.89m-.726 1.867c0-.681-1.103-.578-1.455-.578v1.157c.352 0 1.455.074 1.455-.579m-.241-1.633c0-.62-.921-.525-1.214-.525v1.05c.293 0 1.214.07 1.214-.525" }));
}
BCD.DefaultColor = DefaultColor;
var BCD_default = BCD;
//# sourceMappingURL=BCD.js.map
