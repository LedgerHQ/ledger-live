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
var EUROC_exports = {};
__export(EUROC_exports, {
  default: () => EUROC_default
});
module.exports = __toCommonJS(EUROC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#2775c9";
function EUROC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12" }), /* @__PURE__ */ React.createElement("path", { d: "M7.741 12.55l-.434.587a.306.306 0 00.273.444h1.423c.45 1.86 1.746 3.129 3.481 3.102q1.85-.002 2.782-1.833a.306.306 0 00-.149-.417l-.679-.303a.305.305 0 00-.398.143c-.32.65-.852 1.064-1.555 1.064q-.954.001-1.539-.941a3.5 3.5 0 01-.367-.815h1.822a.31.31 0 00.274-.168l.435-.587a.306.306 0 00-.274-.444h-2.462a7 7 0 01-.002-.775h2.029a.31.31 0 00.274-.168l.435-.587a.306.306 0 00-.274-.444h-2.259c.331-1.077 1.02-1.783 1.908-1.769.677 0 1.202.371 1.538.977a.303.303 0 00.388.125l.682-.301a.306.306 0 00.147-.426q-.945-1.707-2.755-1.709c-1.101 0-1.982.438-2.652 1.307-.392.512-.664 1.112-.826 1.796h-.991a.31.31 0 00-.274.168l-.434.587a.306.306 0 00.274.444h1.262a8 8 0 00-.005.775h-.823a.31.31 0 00-.273.168z" }), /* @__PURE__ */ React.createElement("path", { d: "M4.104 11.494c.247-3.945 3.422-7.13 7.367-7.389a7.88 7.88 0 015.472 1.724c.144.115.35.11.488-.013l.581-.518a.38.38 0 00-.01-.574 9.4 9.4 0 00-6.408-2.152c-4.83.204-8.76 4.089-9.017 8.916a9.4 9.4 0 001.513 5.653.378.378 0 00.568.073l.581-.518a.376.376 0 00.068-.481 7.87 7.87 0 01-1.203-4.719zM19.91 6.859a.378.378 0 00-.568-.073l-.581.518a.376.376 0 00-.069.481 7.87 7.87 0 011.204 4.719c-.247 3.945-3.423 7.13-7.367 7.389a7.88 7.88 0 01-5.472-1.723.38.38 0 00-.488.012l-.581.518a.38.38 0 00.009.574 9.4 9.4 0 006.409 2.152c4.83-.204 8.76-4.09 9.016-8.917a9.4 9.4 0 00-1.513-5.652z" }));
}
EUROC.DefaultColor = DefaultColor;
var EUROC_default = EUROC;
//# sourceMappingURL=EUROC.js.map
