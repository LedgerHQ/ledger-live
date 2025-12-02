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
var DCN_exports = {};
__export(DCN_exports, {
  default: () => DCN_default
});
module.exports = __toCommonJS(DCN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#136485";
function DCN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M7.827 23.255a12 12 0 01-4.203-2.661l.11-.193c1.791-2.83 3.4-5.759 4.611-8.888 1.285-3.318 2.313-6.725 3.293-10.145.088-.305.192-.605.288-.908a.8.8 0 01.172.341c.615 2.194 1.21 4.395 1.848 6.582 1.163 3.985 2.798 7.765 4.963 11.308q.38.62 1.29 2.071a12 12 0 01-4.526 2.666A3246 3246 0 0011.92 12.05l-.115-.001q-1.312 3.686-3.979 11.206M12.057.037h-.094L12 0z", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M7.827 23.255a12 12 0 01-4.203-2.661l.11-.193c1.791-2.83 3.4-5.759 4.611-8.888 1.285-3.318 2.313-6.725 3.293-10.145.088-.305.192-.605.288-.908a.8.8 0 01.172.341c.615 2.194 1.21 4.395 1.848 6.582 1.163 3.985 2.798 7.765 4.963 11.308q.38.62 1.29 2.071a12 12 0 01-4.526 2.666A3246 3246 0 0011.92 12.05l-.115-.001q-1.312 3.686-3.979 11.206M12.057.037h-.094L12 0z", clipRule: "evenodd" }));
}
DCN.DefaultColor = DefaultColor;
var DCN_default = DCN;
//# sourceMappingURL=DCN.js.map
