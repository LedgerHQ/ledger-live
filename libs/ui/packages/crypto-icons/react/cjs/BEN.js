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
var BEN_exports = {};
__export(BEN_exports, {
  default: () => BEN_default
});
module.exports = __toCommonJS(BEN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function BEN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 36 35", fill: color }, /* @__PURE__ */ React.createElement("path", { stroke: "url(#prefix__a)", strokeLinejoin: "round", d: "M24.146 11.87l2.992 1.284 2.486 1.072 2.8 1.197 2.128.915a.035.035 0 01.01.059l-1.337 1.148-2.533 2.174-4.203 3.577-.64-3.148a.03.03 0 00-.016-.02.03.03 0 00-.024.001 9.2 9.2 0 00-2.766 2.253 5.2 5.2 0 00-.783 1.329q-.674 1.5-.953 3.122a26 26 0 00-.37 3.874q-.015.84-.024 1.681c0 .08-.046.154-.117.189l-2.736 1.346q-1.208-.586-2.775-1.462-.21-.118-.19-.337l.009-.109q.023-1.316.05-2.632l.001-.01V29.3l.008-.628q.019-1.621.315-3.219.948-4.464 4.343-7.439a19 19 0 011.708-1.319 33 33 0 013.198-1.806.05.05 0 00.027-.056zm-12.936.002l-.763 3.661a.073.073 0 00.059.087 9.4 9.4 0 013.652 1.428q1.119.735 2.078 1.67.01.01.009.025a.03.03 0 01-.015.023l-3.028 1.783-1.484.845a.19.19 0 01-.179.003 13 13 0 00-2.065-.87.04.04 0 00-.031.002.03.03 0 00-.018.023l-.216.979-.563 2.582-3.34-3.486-3.642-3.816L1 16.077l3.148-1.313 3.524-1.471 2.559-1.063.933-.394q.058-.025.046.036zM17.756 1q.02 0 .032.017l6.176 9.14a.03.03 0 01.003.024.02.02 0 01-.017.014l-.226.016a66 66 0 00-3.522.002.02.02 0 00-.02.02l.032 3.675q.012.294.008.586l.006.133a.39.39 0 01-.158.345l-.08.061q-1.002.859-1.986 1.736a.05.05 0 01-.062 0 36 36 0 00-2.408-1.778.25.25 0 01-.115-.214l-.044-4.5a.04.04 0 00-.04-.04l-3.924-.004q-.064 0-.028-.053l3.51-5.078 2.128-3.065.702-1.02A.04.04 0 0117.756 1z" }), /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "prefix__a", x1: 1, x2: 34.573, y1: 17.54, y2: 17.54, gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", null), /* @__PURE__ */ React.createElement("stop", { offset: 0.5 }), /* @__PURE__ */ React.createElement("stop", { offset: 1 }))));
}
BEN.DefaultColor = DefaultColor;
var BEN_default = BEN;
//# sourceMappingURL=BEN.js.map
