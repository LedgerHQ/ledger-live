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
var HUSH_exports = {};
__export(HUSH_exports, {
  default: () => HUSH_default
});
module.exports = __toCommonJS(HUSH_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#292929";
function HUSH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M11.255 13.993q.002-.518 0-1.033c-.001-.097.026-.17.116-.209.082-.036.168-.01.24.074q.322.376.642.754.113.131.223.265a.13.13 0 01.029.075q.002.546 0 1.091a.636.636 0 01-.578.641.63.63 0 01-.666-.544c-.007-.041-.006-.084-.006-.126zm.002-6.757l-.002-.045V5.142c0-.315.217-.58.51-.632a.623.623 0 01.737.616c.007.698.003 1.397.004 2.095l-.004.036c-.145-.249-.346-.373-.62-.372-.272 0-.475.12-.625.35m-.002 9.46c.153.232.357.35.63.35.274-.001.473-.126.621-.357v1.736c0 .17.005.342-.01.51a.62.62 0 01-.653.565.63.63 0 01-.586-.625q-.004-1.004-.002-2.01zm1.251-6.62v1.245c0 .119-.037.184-.127.22a.23.23 0 01-.27-.071l-.543-.636q-.142-.163-.28-.33a.13.13 0 01-.03-.075q-.003-.804 0-1.607a.63.63 0 01.574-.632c.297-.033.59.188.66.498a1 1 0 01.015.16zm1.298-2.533V5.878c.002-.301.174-.547.44-.631.406-.129.81.177.813.618q.002.624 0 1.246v2.096a.64.64 0 01-.47.638.627.627 0 01-.778-.562l-.004-.115V7.543m-3.783 8.027v1.924a.634.634 0 01-.52.635c-.36.07-.719-.223-.73-.598q-.002-.16 0-.321v-3.565c0-.3.192-.552.471-.624a.625.625 0 01.779.609q.002.97 0 1.94m0-7.084v2.624a.634.634 0 01-.492.63.626.626 0 01-.757-.607c-.004-.38 0-.759-.002-1.138v-4.13c0-.309.201-.567.49-.632a.626.626 0 01.76.616c.003.674 0 1.348 0 2.022zm3.783 6.14v-2.85c0-.285.122-.496.375-.614.407-.189.863.112.878.572v5.736c0 .314-.18.563-.462.643a.626.626 0 01-.786-.555l-.004-.12v-2.814zm3.82-2.9v4.455a.64.64 0 01-.502.639.63.63 0 01-.747-.6V7.28c0-.288.144-.518.389-.62.412-.173.86.138.86.598zm-9.999-.007v4.462a.634.634 0 01-.489.637c-.375.09-.75-.205-.761-.599V7.266c0-.306.184-.555.465-.633a.625.625 0 01.784.601c.004.491.001.983.001 1.475z", clipRule: "evenodd" }));
}
HUSH.DefaultColor = DefaultColor;
var HUSH_default = HUSH;
//# sourceMappingURL=HUSH.js.map
