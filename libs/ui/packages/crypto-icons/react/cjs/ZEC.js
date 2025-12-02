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
var ZEC_exports = {};
__export(ZEC_exports, {
  default: () => ZEC_default
});
module.exports = __toCommonJS(ZEC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f4b728";
function ZEC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.322 14.885h4.723v2.512h-2.907c.049.719.073 1.385.121 2.103h-2.446v-2.078H7.906c0-.82-.096-1.64.05-2.41.072-.41.508-.769.774-1.127q1.382-1.727 2.785-3.436c.364-.437.727-.847 1.139-1.333h-4.53V6.603h2.69V4.5h2.348v2.051h2.931c0 .846.097 1.667-.048 2.436-.073.41-.509.77-.799 1.128a347 347 0 01-2.786 3.436q-.548.684-1.138 1.333" }));
}
ZEC.DefaultColor = DefaultColor;
var ZEC_default = ZEC;
//# sourceMappingURL=ZEC.js.map
