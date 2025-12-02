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
var ILK_exports = {};
__export(ILK_exports, {
  default: () => ILK_default
});
module.exports = __toCommonJS(ILK_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#98c23a";
function ILK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 3.158A8.843 8.843 0 1020.843 12 8.857 8.857 0 0012 3.158m0 16.5A7.65 7.65 0 1119.65 12 7.66 7.66 0 0112 19.65zm-3.908-8.445H6.667v-3.12q0-.878.833-.878h3.09a.75.75 0 01.863.877v3.12h-1.41V8.439h-1.95zm1.95.915h1.425v3.75a.75.75 0 01-.862.87H7.5a.75.75 0 01-.825-.886v-3.75h3.375zm5.85.052h1.44v3.75a.75.75 0 01-.87.87h-3.127a.75.75 0 01-.855-.87V8.16a.75.75 0 01.877-.878h3.076a.75.75 0 01.9.878v2.25h-1.5V8.505h-1.876v3.675z" }));
}
ILK.DefaultColor = DefaultColor;
var ILK_default = ILK;
//# sourceMappingURL=ILK.js.map
