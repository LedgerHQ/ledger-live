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
var OAX_exports = {};
__export(OAX_exports, {
  default: () => OAX_default
});
module.exports = __toCommonJS(OAX_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#164b79";
function OAX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M10.568 14l-.467.998H9.064L11.88 9l1.877 4h-1.061l-.84-1.737-.841 1.766zm4.09.976l2.198-2.963-2.213-2.985h1.211l1.606 2.183-.585.802.585.803-1.605 2.182h-2.222l-.47-.997H14.2zM18.054 12l-.593-.816 1.605-2.182h1.185zm0 0l2.197 2.998h-1.184l-1.605-2.182zM8.567 9.869a2.97 2.97 0 01.814 2.132 3.1 3.1 0 01-.814 2.132c-.542.607-1.211.867-2.001.867a2.68 2.68 0 01-2.001-.867A3 3 0 013.75 12a2.97 2.97 0 01.519-1.736l.69.735a2.12 2.12 0 00.271 2.449 1.8 1.8 0 001.335.607 1.8 1.8 0 001.335-.607 2 2 0 00.542-1.421 2.12 2.12 0 00-.543-1.422 1.75 1.75 0 00-1.335-.578 1.64 1.64 0 00-.936.263l-.69-.735a2.56 2.56 0 011.63-.552 2.63 2.63 0 011.998.865z" }));
}
OAX.DefaultColor = DefaultColor;
var OAX_default = OAX;
//# sourceMappingURL=OAX.js.map
