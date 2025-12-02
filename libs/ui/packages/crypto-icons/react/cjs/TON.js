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
var TON_exports = {};
__export(TON_exports, {
  default: () => TON_default
});
module.exports = __toCommonJS(TON_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function TON({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 56 56", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M37.56 15.628H18.44c-3.516 0-5.745 3.792-3.976 6.858l11.801 20.455c.77 1.335 2.7 1.335 3.47 0l11.804-20.455c1.767-3.06-.462-6.858-3.975-6.858zM26.255 36.807l-2.57-4.974-6.202-11.092c-.409-.71.096-1.62.953-1.62h7.816V36.81zM38.51 20.739l-6.2 11.096-2.57 4.972V19.119h7.817c.857 0 1.362.91.953 1.62" }));
}
TON.DefaultColor = DefaultColor;
var TON_default = TON;
//# sourceMappingURL=TON.js.map
