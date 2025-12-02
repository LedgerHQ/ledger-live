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
var PPT_exports = {};
__export(PPT_exports, {
  default: () => PPT_default
});
module.exports = __toCommonJS(PPT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#152743";
function PPT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12.037 6.231c-.987 0-1.788-.55-1.788-1.228 0-.68.8-1.229 1.788-1.229.987 0 1.786.55 1.786 1.229 0 .678-.8 1.228-1.786 1.228m-.925 13.713V6.822h3.984c.148 0 .252.11.252.258v7.281c0 .147-.105.273-.252.273H12.9v5.31c0 .148-.113.282-.26.282h-1.251a.287.287 0 01-.277-.281zm-.672-5.31H8.933a.284.284 0 01-.281-.274V7.08c0-.148.133-.258.28-.258h1.508z" }));
}
PPT.DefaultColor = DefaultColor;
var PPT_default = PPT;
//# sourceMappingURL=PPT.js.map
