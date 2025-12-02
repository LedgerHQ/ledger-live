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
var RCN_exports = {};
__export(RCN_exports, {
  default: () => RCN_default
});
module.exports = __toCommonJS(RCN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3555f9";
function RCN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.77 4.97c.638-.118 1.29-.105 1.935-.073.744.087 1.49.243 2.174.551a7.23 7.23 0 013.317 2.797c.295.43.493.912.691 1.39.185-.295.35-.6.51-.908a.42.42 0 01.383-.249.437.437 0 01.468.382c.019.18-.095.336-.169.492-.234.472-.536.909-.849 1.335-.058.061-.034.147-.027.222.348 2.052-.314 4.237-1.725 5.784a7.35 7.35 0 01-2.983 2.002c-1.318.462-2.77.566-4.134.243-1.977-.428-3.726-1.732-4.72-3.461-.218-.35-.356-.74-.528-1.111-.188.288-.347.592-.506.895a.48.48 0 01-.399.266c-.285 0-.545-.308-.43-.582a7.5 7.5 0 01.96-1.578c.08-.085.07-.205.055-.31-.14-.903-.1-1.824.12-2.71.577-2.494 2.647-4.576 5.156-5.225.232-.054.465-.112.701-.152M9 6.478a6.42 6.42 0 00-2.955 3.249 6.4 6.4 0 00-.435 2.623q.21-.158.402-.342c.746-.666 1.62-1.182 2.533-1.593 1.697-.772 3.566-1.104 5.423-1.194-.627-.65-1.308-1.252-1.936-1.903.198-.217.412-.418.627-.619.244.22.469.46.707.685.773.77 1.568 1.515 2.328 2.295-.81.807-1.64 1.595-2.45 2.403q-.104.096-.215.181c-.204-.205-.441-.385-.605-.626.498-.522 1.065-.98 1.543-1.52-.857.012-1.709.133-2.547.3-.677.12-1.328.35-1.979.568-1.362.51-2.618 1.322-3.576 2.41-.057.056-.048.14-.033.21.113.486.327.94.56 1.38.773 1.393 2.108 2.469 3.642 2.955.897.276 1.854.383 2.787.253a6.45 6.45 0 003.505-1.602c1.398-1.233 2.183-3.111 2.062-4.956-.148.115-.28.246-.418.37a10.1 10.1 0 01-3.183 1.85 14.9 14.9 0 01-4.745.899c.141.184.315.339.48.503.483.471.96.948 1.451 1.412-.189.223-.41.417-.618.62-.209-.17-.39-.367-.585-.554-.73-.708-1.453-1.425-2.182-2.136a2.4 2.4 0 01-.278-.3c.316-.34.68-.632 1.002-.963.555-.537 1.095-1.088 1.657-1.618.21.204.43.399.617.625-.5.517-1.03 1.004-1.537 1.515.555.027 1.102-.068 1.653-.12.397-.042.788-.132 1.18-.214 2.014-.465 3.975-1.421 5.327-2.997-.518-2.238-2.42-4.08-4.685-4.6-1.508-.384-3.153-.166-4.524.55" }));
}
RCN.DefaultColor = DefaultColor;
var RCN_default = RCN;
//# sourceMappingURL=RCN.js.map
