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
var STEEM_exports = {};
__export(STEEM_exports, {
  default: () => STEEM_default
});
module.exports = __toCommonJS(STEEM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#4ba2f2";
function STEEM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.077 6.172c.162.028-.242 1.102-.017 2.33.195 1.052 2.63 5.127 2.53 6.525-.078.878-2.078 2.936-2.288 2.8-.23-.065.607-1.463.297-2.629-.362-1.359-2.505-4.872-2.503-6.423 0-1.135 1.836-2.677 1.98-2.603m4.581-1.605c.206.035-.307 1.407-.02 2.97.247 1.343 3.354 6.54 3.225 8.32-.1 1.12-2.649 3.744-2.919 3.57-.292-.08.776-1.864.38-3.35-.46-1.732-3.194-6.212-3.192-8.19 0-1.448 2.342-3.412 2.526-3.32m4.73 1.605c.161.028-.242 1.102-.017 2.33.195 1.052 2.63 5.127 2.53 6.525-.077.878-2.077 2.936-2.289 2.8-.23-.065.608-1.463.297-2.629-.36-1.359-2.505-4.872-2.503-6.423 0-1.135 1.838-2.677 1.981-2.603" }));
}
STEEM.DefaultColor = DefaultColor;
var STEEM_default = STEEM;
//# sourceMappingURL=STEEM.js.map
