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
var CTXC_exports = {};
__export(CTXC_exports, {
  default: () => CTXC_default
});
module.exports = __toCommonJS(CTXC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function CTXC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.923 3.299c-.11-.248.286-.423.396-.188q3.861 6.65 7.722 13.311c-.137 0-.27-.045-.401-.066l-6.87-1.37c-.226-.01-.275-.375-.055-.429l2.695-.742a.225.225 0 00.149-.313l-3.636-10.21v.006" }), /* @__PURE__ */ React.createElement("path", { d: "M11.528 3.321a1 1 0 01.065.115c.814 2.31 1.65 4.62 2.458 6.93.072.193-.198.352-.33.209-.693-.726-1.353-1.474-2.034-2.2-.11-.099-.27-.033-.342.072l-7.084 8.322c-.082.087-.153.22-.291.236-.1 0-.165-.078-.22-.154v-.127q3.893-6.699 7.778-13.403" }), /* @__PURE__ */ React.createElement("path", { d: "M9.36 11.246c.132-.038.308.055.264.215-.275.957-.566 1.909-.853 2.86-.043.121.066.23.182.236 3.707.743 7.414 1.513 11.12 2.255.073.011.122.066.177.11v.154l-.105.11H4.41c1.65-1.98 3.295-3.971 4.95-5.94" }), /* @__PURE__ */ React.createElement("path", { d: "M11.923 3.299c-.11-.248.286-.423.396-.188q3.861 6.65 7.722 13.311c-.137 0-.27-.045-.401-.066l-6.87-1.37c-.226-.01-.275-.375-.055-.429l2.695-.742a.225.225 0 00.149-.313l-3.636-10.21v.006" }), /* @__PURE__ */ React.createElement("path", { d: "M11.528 3.321a1 1 0 01.065.115c.814 2.31 1.65 4.62 2.458 6.93.072.193-.198.352-.33.209-.693-.726-1.353-1.474-2.034-2.2-.11-.099-.27-.033-.342.072l-7.084 8.322c-.082.087-.153.22-.291.236-.1 0-.165-.078-.22-.154v-.127q3.893-6.699 7.778-13.403" }), /* @__PURE__ */ React.createElement("path", { d: "M9.36 11.246c.132-.038.308.055.264.215-.275.957-.566 1.909-.853 2.86-.043.121.066.23.182.236 3.707.743 7.414 1.513 11.12 2.255.073.011.122.066.177.11v.154l-.105.11H4.41c1.65-1.98 3.295-3.971 4.95-5.94" }));
}
CTXC.DefaultColor = DefaultColor;
var CTXC_default = CTXC;
//# sourceMappingURL=CTXC.js.map
