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
var BTM_exports = {};
__export(BTM_exports, {
  default: () => BTM_default
});
module.exports = __toCommonJS(BTM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#504c4c";
function BTM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M8.12 11.532l-1.308 2.774.608 2.274 1.55.414 1.923 1.925-.579.581-4.584-1.23-1.23-4.584.923-.921 4.006-4.007zl-1.308 2.774 4.081-4.082-1.464-1.466zm2.104 1.575l4.082 4.082 2.274-.61.415-1.549 1.924-1.923.581.579-1.229 4.586-4.585 1.228-4.927-4.929zm3.552-2.214L9.695 6.811l-2.276.61-.414 1.547-1.924 1.925-.581-.579 1.23-4.585L10.314 4.5l.921.923 4.005 4.005zm1.254-3.888l-1.923-1.924.579-.581 4.586 1.229 1.228 4.585-4.929 4.927-1.464-1.465 4.083-4.083-.61-2.274z" }));
}
BTM.DefaultColor = DefaultColor;
var BTM_default = BTM;
//# sourceMappingURL=BTM.js.map
