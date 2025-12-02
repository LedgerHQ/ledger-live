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
var EXMO_exports = {};
__export(EXMO_exports, {
  default: () => EXMO_default
});
module.exports = __toCommonJS(EXMO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#347ffb";
function EXMO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M14.796 9.416l-2.152 5.813-.013.035-.395-.791-.825.375L13.575 9l.825-.375zm5.385.137l-2.151 5.822-.395-.793-.825.374.05-.136L19.01 9l.825-.375.394.791zm-4.605 5.034l1.267-3.422-.828.375-.393-.792-1.27 3.421.394.793zm-6.853-3.374H4.94l.646.6-.646.61h3.78l.643-.61zM4.416 13.75h6.116l-.643.605.643.604H4.416l-.645-.604zm1.876-5.076h6.112l-.64.606.641.604H6.293l-.646-.605z", clipRule: "evenodd" }));
}
EXMO.DefaultColor = DefaultColor;
var EXMO_default = EXMO;
//# sourceMappingURL=EXMO.js.map
