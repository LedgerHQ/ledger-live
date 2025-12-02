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
var MZC_exports = {};
__export(MZC_exports, {
  default: () => MZC_default
});
module.exports = __toCommonJS(MZC_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ffaa05";
function MZC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.608 9.05v1.397h1.66l-.75.861h-1.115v1.083h1.16l-.568.86h-.591v2.209l-.955 1.302v-3.51h-1.32l.728-.861h.592v-1.083H9.584l.75-.86h1.115V9q-.825-.893-2.275-.893c-1.854 0-3.321 1.977-3.321 3.942q0 1.964.899 3.333l-1.035 1.203Q4.5 14.783 4.5 12.468c0-3.39 2.918-5.343 4.98-5.343q1.896 0 2.903 1.588 1.928-1.323 3.945-1.323c2.058 0 3.172 2.512 3.172 4.912 0 3.194-2.15 4.427-2.934 4.57a.16.16 0 01-.154-.06.146.146 0 01.039-.208q1.82-1.224 1.82-3.75c0-3.676-1.887-4.526-3.275-4.526a4.27 4.27 0 00-2.388.722", clipRule: "evenodd" }));
}
MZC.DefaultColor = DefaultColor;
var MZC_default = MZC;
//# sourceMappingURL=MZC.js.map
