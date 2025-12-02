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
var ENTRP_exports = {};
__export(ENTRP_exports, {
  default: () => ENTRP_default
});
module.exports = __toCommonJS(ENTRP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fa5836";
function ENTRP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.074 3.361c-.08.012-.394.07-.694.116-1.68.283-3.23 1.105-4.514 2.395-1.29 1.285-2.076 2.772-2.406 4.543-.15.805-.15 2.378 0 3.183.33 1.77 1.117 3.257 2.407 4.542 1.285 1.29 2.771 2.078 4.542 2.408.805.15 2.378.15 3.183 0 1.77-.33 3.258-1.118 4.543-2.408 1.29-1.285 2.077-2.771 2.407-4.542.15-.805.15-2.378 0-3.183-.33-1.77-1.117-3.258-2.407-4.543-1.256-1.261-2.674-2.03-4.392-2.377-.533-.11-2.303-.197-2.668-.134m3.09 3.068c.07.028.092.115.092.346v.313h-.364c-.463 0-.827.173-.978.463-.098.185-.104.41-.104 3.154 0 1.62-.023 2.98-.046 3.02-.122.185-1.013.238-1.412.08l-.162-.063v-2.99c0-2.79-.006-3.016-.105-3.201-.15-.29-.515-.463-.978-.463h-.364v-.313c0-.196.03-.324.075-.34.105-.047 4.236-.047 4.346-.007M10.842 8.84v.712l-.168.098c-.248.145-.665.579-.832.862a3 3 0 00-.244.585l-.092.33H8.84c-.759 0-.735.029-.573-.607.202-.77.694-1.552 1.29-2.026.33-.266 1.059-.666 1.203-.666.064 0 .081.15.081.713zm2.87-.509a3.88 3.88 0 012.02 2.488c.162.637.186.608-.573.608h-.665l-.093-.33a3 3 0 00-.243-.585c-.168-.283-.585-.717-.833-.862l-.168-.098V8.84c0-.561.017-.712.08-.712.041 0 .256.093.476.203m-4.2 3.64c0 .272.18.827.364 1.117a2.506 2.506 0 004.248 0c.185-.29.364-.845.364-1.118v-.196h1.383l-.03.3c-.144 1.407-.92 2.542-2.134 3.143a3.6 3.6 0 01-1.707.394c-2.025 0-3.628-1.476-3.843-3.536l-.028-.3h1.383zm3.327 4.184c.075.405.492.654 1.117.654h.3v.636H9.743v-.62l.422-.028c.272-.018.492-.07.614-.14.18-.103.41-.45.41-.613 0-.057.186-.075.805-.075h.81z" }));
}
ENTRP.DefaultColor = DefaultColor;
var ENTRP_default = ENTRP;
//# sourceMappingURL=ENTRP.js.map
