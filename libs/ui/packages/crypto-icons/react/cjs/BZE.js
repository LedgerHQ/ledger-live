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
var BZE_exports = {};
__export(BZE_exports, {
  default: () => BZE_default
});
module.exports = __toCommonJS(BZE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function BZE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.464 18.346H6.198l.837-4.736 4.429-3.99H7.697l3.046-1.866h4.952L9.29 14.076l-.43 2.415s1.43.105 2.557 0c1.128-.116 2.395-.583 2.395-.583zm6.708-10.137l-1.907 1.867s1.605 1.784.128 4.234c-1.453 2.403-6.277 1.96-6.277 1.96l.372-2.111 6.788-6.627H10.65l.57-3.22H8.5l-.977 5.506h3.465l-4.116 3.71L6 18.522s3.29.093 6.08 0c2.802-.094 6.068-2.497 6.545-5.215.65-3.674-1.453-5.097-1.453-5.097" }), /* @__PURE__ */ React.createElement("path", { d: "M10.09 18.908H5.822l.837-4.736 4.429-3.99H7.322l3.046-1.866h4.952l-6.405 6.323-.43 2.415s1.43.105 2.557 0c1.128-.117 2.395-.583 2.395-.583zm6.707-10.137l-1.906 1.867s1.604 1.785.127 4.235c-1.453 2.403-6.277 1.96-6.277 1.96l.372-2.112 6.789-6.626h-5.627l.57-3.22h-2.72l-.977 5.506h3.465l-4.116 3.71-.872 4.993s3.29.093 6.08 0c2.802-.094 6.068-2.497 6.545-5.215.65-3.675-1.453-5.098-1.453-5.098" }));
}
BZE.DefaultColor = DefaultColor;
var BZE_default = BZE;
//# sourceMappingURL=BZE.js.map
