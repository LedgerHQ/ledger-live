var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => BTCH_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#4700C2";
function BTCH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M10.265 10.392c-.233.151-.499.312-.775.48v1.516c.25-.127.509-.255.775-.382V10.39zM6.39 13.195a.585.585 0 00.78.255l.724-.366c.005-.609.008-1.071.008-1.255v-.049c-.615.306-1.082.54-1.261.63a.582.582 0 00-.251.785zm4.094-.154a.577.577 0 00.577.58h.007a.58.58 0 00.579-.58V8.239a.58.58 0 00-.655-.576.576.576 0 00-.506.573v2.399c-.002.805-.002 1.605-.002 2.406z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M18.742 9.322c-.037-.28-.223-.437-.506-.51a2.89 2.89 0 00-.694-.072c-.552-.002-1.1.087-1.643.193a21.69 21.69 0 00-2.322.585c-.23.07-.458.144-.688.218l-.002-.01.041-.034c.444-.38.885-.759 1.332-1.134a23.584 23.584 0 002.684-2.695c.223-.26.416-.538.515-.855.15-.477-.018-.773-.501-.906a2.475 2.475 0 00-.626-.07c-.46-.002-.915.074-1.364.166a21.37 21.37 0 00-1.607.41c-.736.224-1.645.611-2.457.94-.413.16-.854.368-1.267.53l-1.56.634c-2.07.89-2.671.25-2.671.25 0 .003 0 .005.002.008a.07.07 0 01-.01-.02c-.402.794-.067 2.236 2.261 1.206.366-.142.738-.297 1.102-.437.701-.274 1.396-.612 2.1-.883.484-.2.973-.389 1.465-.568l.444-.173c.455-.15.91-.298 1.375-.414.506-.13.947-.21 1.215-.175.027.003.054.005.08.01.121.016.186.08.175.165-.005.131-.216.566-2.142 2.17l-.42.36c-.217.187-.426.37-.638.555l-.177.156-.002.002-.083.074a.17.17 0 01-.02.018l-.021.018-.161.123a.478.478 0 01-.035.03v2.034c.681-.232 3.995-1.338 4.352-1.014.027.038.448.3-3.405 2.935-.151.115-.298.23-.45.345l-.557.425c-.697.504-1.389 1.01-2.085 1.514l-.302.218c-.005.55-.007 1.076-.009 1.56l7.35-5.424c.448-.378.873-.782 1.272-1.212.225-.24.427-.496.561-.788.069-.152.12-.3.099-.458zM6.767 17.663a.621.621 0 00.039.821.616.616 0 00.764.106l.294-.216c.002-.442.008-.98.011-1.56l-.993.737a.67.67 0 00-.115.112z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M9.276 9.218a.58.58 0 00-.637-.425.576.576 0 00-.506.573v2.398c0 .486-.02 2.894-.039 4.892-.004.573-.01 1.11-.012 1.56-.004.57-.007.997-.007 1.172a.578.578 0 00.578.58h.007a.58.58 0 00.58-.58c0-.402.004-1.136.008-2.035.003-.48.008-1.01.01-1.56.016-2.5.039-5.445.037-6.427 0-.05-.007-.1-.019-.148z"
  }));
}
BTCH.DefaultColor = DefaultColor;
var BTCH_default = BTCH;
//# sourceMappingURL=BTCH.js.map
