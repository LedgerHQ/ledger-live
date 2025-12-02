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
var PYUSD_exports = {};
__export(PYUSD_exports, {
  default: () => PYUSD_default
});
module.exports = __toCommonJS(PYUSD_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function PYUSD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 48 48", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M27.812 9.605h-8.444c-.935 0-1.756.68-1.898 1.616l-.595 3.825v.028H14.04a1.36 1.36 0 00-1.36 1.36c0 .765.624 1.36 1.36 1.389h2.409l-.425 2.635-.029.198h-2.833a1.36 1.36 0 00-1.36 1.36c0 .737.623 1.36 1.36 1.36h2.408l-1.303 8.246-.425 2.749-.227 1.473a1.917 1.917 0 001.899 2.21h6.347c.935 0 1.728-.68 1.898-1.615l1.219-7.565h2.975c5.355 0 9.719-4.42 9.634-9.804-.085-5.3-4.505-9.465-9.776-9.465m-8.585 8.218l8.557.028a1.42 1.42 0 011.417 1.417 1.42 1.42 0 01-1.417 1.417h-9.01zm8.613 8.274h-3.57c-.935 0-1.728.68-1.898 1.615l-1.219 7.594h-4.647l1.842-11.901h9.436a4.14 4.14 0 004.137-4.137c0-2.267-1.87-4.137-4.137-4.137l-8.104-.029.425-2.72h7.877c3.854 0 6.97 3.174 6.886 7.028-.114 3.74-3.259 6.687-7.028 6.687" }));
}
PYUSD.DefaultColor = DefaultColor;
var PYUSD_default = PYUSD;
//# sourceMappingURL=PYUSD.js.map
