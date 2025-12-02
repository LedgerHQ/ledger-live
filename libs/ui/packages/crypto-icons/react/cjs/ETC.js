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
var ETC_exports = {};
__export(ETC_exports, {
  default: () => ETC_default
});
module.exports = __toCommonJS(ETC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0b8311";
function ETC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M12 12.432L6.96 12 12 9.148zm0 3.345v5.205c-1.752-2.728-3.684-5.731-5.241-8.162 1.837 1.035 3.756 2.117 5.241 2.958m0-7.55L6.76 11.15 12 3.018zM17.041 12l-5.04.432V9.148zm-5.04 3.778c1.485-.84 3.402-1.923 5.24-2.958-1.556 2.432-3.488 5.435-5.24 8.162zm0-7.552V3.018l5.24 8.133z" }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 12.432L17.04 12 12 14.83z", clipRule: "evenodd", opacity: 0.2 }), /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 12.432L6.959 12l5.04 2.83z", clipRule: "evenodd", opacity: 0.603 }));
}
ETC.DefaultColor = DefaultColor;
var ETC_default = ETC;
//# sourceMappingURL=ETC.js.map
