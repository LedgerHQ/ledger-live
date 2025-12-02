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
var NYM_exports = {};
__export(NYM_exports, {
  default: () => NYM_default
});
module.exports = __toCommonJS(NYM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function NYM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 20 20", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10 20c5.523 0 10-4.477 10-10S15.523 0 10 0 0 4.477 0 10s4.477 10 10 10" }), /* @__PURE__ */ React.createElement("path", { d: "M10 19.999a9.94 9.94 0 01-7.071-2.929A9.93 9.93 0 010 10a9.93 9.93 0 012.929-7.072A9.93 9.93 0 019.999 0a9.93 9.93 0 017.072 2.928A9.93 9.93 0 0119.999 10a9.94 9.94 0 01-2.928 7.071A9.94 9.94 0 0110 20m0-18.57A8.58 8.58 0 001.429 10a8.58 8.58 0 008.57 8.571A8.58 8.58 0 0018.572 10 8.58 8.58 0 0010 1.428" }), /* @__PURE__ */ React.createElement("path", { d: "M9.285 19.974v-1.433a8.5 8.5 0 001.428 0v1.434a10 10 0 01-1.428 0m6.246-3.433a8.6 8.6 0 001.01-1.01l1.016 1.016a10 10 0 01-1.01 1.01zm-12.602.53q-.254-.255-.488-.524l1.017-1.016q.463.547 1.01 1.01L3.45 17.557a10 10 0 01-.523-.487zm15.612-6.358a9 9 0 000-1.428h1.433a10 10 0 010 1.428zm-18.516 0a10 10 0 010-1.428h1.434a9 9 0 000 1.428zm2.416-7.261a10 10 0 011.011-1.01l1.016 1.015a9 9 0 00-1.01 1.011zm13.09.005l1.016-1.015a10 10 0 011.01 1.01l-1.016 1.016a8.6 8.6 0 00-1.01-1.01M9.286.025a10 10 0 011.428 0v1.432a9 9 0 00-1.428 0z", opacity: 0.41 }), /* @__PURE__ */ React.createElement("path", { d: "M14.039 5.96a5.71 5.71 0 00-8.079 0 5.71 5.71 0 000 8.079 5.71 5.71 0 008.079 0 5.71 5.71 0 000-8.079m-.492 7.587a5.025 5.025 0 01-7.101 0 5.025 5.025 0 010-7.101 5.025 5.025 0 017.101 0 5.013 5.013 0 010 7.101" }), /* @__PURE__ */ React.createElement("path", { d: "M13.084 13.33V6.67a4.6 4.6 0 00-.966-.704v6.37L7.914 5.943a4.5 4.5 0 00-1 .72v6.667c.29.275.615.511.966.703v-6.37l4.205 6.393q.549-.294.999-.726" }));
}
NYM.DefaultColor = DefaultColor;
var NYM_default = NYM;
//# sourceMappingURL=NYM.js.map
