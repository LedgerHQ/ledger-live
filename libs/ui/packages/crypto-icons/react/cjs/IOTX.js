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
var IOTX_exports = {};
__export(IOTX_exports, {
  default: () => IOTX_default
});
module.exports = __toCommonJS(IOTX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#00d4d5";
function IOTX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M13.892 3.496v4.092l3.553-2.043z" }), /* @__PURE__ */ React.createElement("path", { d: "M17.445 5.545v4.092l3.553-2.049z", opacity: 0.9 }), /* @__PURE__ */ React.createElement("path", { d: "M13.892 7.589v4.092l3.553-2.043zm3.553 2.05v4.091l3.553-2.049z", opacity: 0.8 }), /* @__PURE__ */ React.createElement("path", { d: "M13.892 11.681v4.093l3.553-2.044z", opacity: 0.8 }), /* @__PURE__ */ React.createElement("path", { d: "M17.445 13.73v4.093l3.553-2.049z" }), /* @__PURE__ */ React.createElement("path", { d: "M4.707 7.45v4.093l3.554-2.049z", opacity: 0.4 }), /* @__PURE__ */ React.createElement("path", { d: "M9.19 8.972v4.093l3.547-2.044z", opacity: 0.2 }), /* @__PURE__ */ React.createElement("path", { d: "M6.556 11.56v4.093l3.552-2.049z", opacity: 0.3 }), /* @__PURE__ */ React.createElement("path", { d: "M8.897 14.649v4.093l3.548-2.05z", opacity: 0.9 }), /* @__PURE__ */ React.createElement("path", { d: "M13.862 16.41v4.094l3.548-2.05z", opacity: 0.7 }), /* @__PURE__ */ React.createElement("path", { d: "M9.781 6.95v4.094l3.548-2.043z", opacity: 0.9 }), /* @__PURE__ */ React.createElement("path", { d: "M13.892 3.496v4.092l-3.554-2.043z", opacity: 0.8 }), /* @__PURE__ */ React.createElement("path", { d: "M9.781 5.236v4.092l-3.554-2.05zm3.554 2.024v4.094l-3.554-2.05z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M9.173 8.972v4.093L5.62 11.02z", opacity: 0.95 }), /* @__PURE__ */ React.createElement("path", { d: "M13.892 11.681v4.093l-3.548-2.044z", opacity: 0.6 }), /* @__PURE__ */ React.createElement("path", { d: "M6.556 12.635v4.092l-3.554-2.05z", opacity: 0.55 }), /* @__PURE__ */ React.createElement("path", { d: "M20.998 7.589v4.092l-3.553-2.043z" }), /* @__PURE__ */ React.createElement("path", { d: "M17.445 9.638v4.092l-3.553-2.049z", opacity: 0.95 }), /* @__PURE__ */ React.createElement("path", { d: "M20.998 11.681v4.093l-3.553-2.044z", opacity: 0.9 }), /* @__PURE__ */ React.createElement("path", { d: "M17.445 13.73v4.093l-3.553-2.049z", opacity: 0.7 }), /* @__PURE__ */ React.createElement("path", { d: "M13.105 15.436v4.093l-3.553-2.044z", opacity: 0.4 }), /* @__PURE__ */ React.createElement("path", { d: "M17.445 5.545v4.092l-3.553-2.049z" }));
}
IOTX.DefaultColor = DefaultColor;
var IOTX_default = IOTX;
//# sourceMappingURL=IOTX.js.map
