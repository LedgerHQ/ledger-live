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
var XBTC_exports = {};
__export(XBTC_exports, {
  default: () => XBTC_default
});
module.exports = __toCommonJS(XBTC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function _0XBTC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 20.444A8.443 8.443 0 013.557 12 8.443 8.443 0 0112 3.557 8.443 8.443 0 0120.444 12 8.443 8.443 0 0112 20.444m0-.497a7.947 7.947 0 100-15.894 7.947 7.947 0 000 15.894", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M10.568 18.099c.186-.076.913-.637 1.616-1.241q1.307-1.112 2.51-2.335c.77-.77 1.056-1.1 1.103-1.271.167-.601-1.654-7.205-2.024-7.346-.226-.087-2.245 1.592-4.033 3.35-1.048 1.03-1.338 1.373-1.361 1.597-.015.174.045.608.157 1.122.445 2.042 1.254 4.862 1.663 5.789.172.393.191.41.368.335" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 20.444A8.443 8.443 0 013.556 12 8.443 8.443 0 0112 3.556 8.443 8.443 0 0120.444 12 8.443 8.443 0 0112 20.444m0-.497a7.947 7.947 0 100-15.894 7.947 7.947 0 000 15.894", clipRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M10.568 18.099c.186-.076.913-.637 1.616-1.241q1.307-1.112 2.51-2.335c.77-.77 1.056-1.1 1.103-1.271.167-.601-1.654-7.205-2.024-7.347-.226-.087-2.245 1.593-4.033 3.35-1.048 1.031-1.339 1.374-1.361 1.598-.015.174.045.608.157 1.122.444 2.042 1.254 4.862 1.663 5.789.172.393.191.41.368.335" }));
}
_0XBTC.DefaultColor = DefaultColor;
var XBTC_default = _0XBTC;
//# sourceMappingURL=_0XBTC.js.map
