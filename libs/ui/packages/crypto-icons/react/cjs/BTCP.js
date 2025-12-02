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
var BTCP_exports = {};
__export(BTCP_exports, {
  default: () => BTCP_default
});
module.exports = __toCommonJS(BTCP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#272d63";
function BTCP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M15.536 5.4l-.525 2.132c1.623.566 2.818 1.417 2.585 2.992-.068.479-.233.958-.573 1.32-.292.313-.748.479-1.137.606a4.8 4.8 0 01-1.448.254c-.33 0-.65-.01-.98-.039-.535-.04-1.08-.088-1.603-.205-.165-.04-.321-.069-.467-.108l-.71 2.865-.417 1.564-.525 2.142-1.292-.322.535-2.162c-.301-.078-.613-.166-.923-.244l-1.68-.42.64-1.478s.953.255.942.236c.37.088.525-.157.593-.313l.729-2.934.34-1.359.389-1.564c.019-.274-.078-.626-.603-.753.02-.01-.942-.235-.942-.235l.34-1.388 1.777.45c.273.067.545.126.827.194l.525-2.131 1.291.322-.514 2.093c.34.079.69.157 1.03.245l.504-2.083zm-.106 7.725c.36-.06.796-.206 1.107-.333.01-.01.03-.01.039-.02.67.597.99 1.565.553 2.807-.69 2.014-2.35 2.18-4.546 1.76l-.534 2.161-1.283-.323.495-2.063.02-.068.39-1.585c1.145.255 2.69.421 2.981-.772.156-.636-.145-1.095-.631-1.428l.505-.03a7 7 0 00.904-.107zm-.38-2.621c.38-1.535-1.972-1.868-2.7-2.063l-.642 2.6c.73.186 2.983.93 3.342-.537" }));
}
BTCP.DefaultColor = DefaultColor;
var BTCP_default = BTCP;
//# sourceMappingURL=BTCP.js.map
