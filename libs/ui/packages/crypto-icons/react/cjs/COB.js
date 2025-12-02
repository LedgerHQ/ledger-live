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
var COB_exports = {};
__export(COB_exports, {
  default: () => COB_default
});
module.exports = __toCommonJS(COB_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function COB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 18.75H8.598l1.704-2.968h3.396l1.704 2.968zM10.303 8.217L8.598 5.25h6.804l-1.704 2.967h-3.396m7.499 7.154l-1.705 2.969-1.698-2.968h.001l1.697-2.969H19.5zM6.198 8.622l1.704-2.968L9.6 8.622l-1.698 2.967H4.5zm3.401 6.75L7.902 18.34l-1.704-2.968-1.698-2.97h3.402zm8.203-6.75L19.5 11.59h-3.402l-1.699-2.968 1.698-2.968z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 18.75H8.598l1.704-2.968h3.396l1.704 2.968zM10.303 8.217L8.598 5.25h6.804l-1.704 2.967h-3.396m7.499 7.154l-1.705 2.969-1.698-2.968h.001l1.697-2.969H19.5zM6.198 8.622l1.704-2.968L9.6 8.622l-1.698 2.967H4.5zm3.401 6.75L7.902 18.34l-1.704-2.968-1.698-2.97h3.402zm8.203-6.75L19.5 11.59h-3.402l-1.699-2.968 1.698-2.968z" }));
}
COB.DefaultColor = DefaultColor;
var COB_default = COB;
//# sourceMappingURL=COB.js.map
