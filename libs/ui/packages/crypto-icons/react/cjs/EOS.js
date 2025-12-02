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
var EOS_exports = {};
__export(EOS_exports, {
  default: () => EOS_default
});
module.exports = __toCommonJS(EOS_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function EOS({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12 3.039a.32.32 0 01.26.13l3.836 5.24a.3.3 0 01.054.12l1.856 8.478a.32.32 0 01-.143.34l-5.69 3.565a.3.3 0 01-.173.05.3.3 0 01-.172-.05l-5.692-3.565a.32.32 0 01-.142-.34L7.849 8.53a.3.3 0 01.055-.12l3.835-5.24A.32.32 0 0112 3.039m-.323 1.299l-3.16 4.318.788 2.479 2.372-4.186zM12 7.678l-2.43 4.288 1.526 4.79h1.808l1.526-4.791zm2.86 5.046l-1.284 4.032h3.568zm1.72 4.672h-3.208l-.8 2.51zM12 19.595l.7-2.2h-1.4zm-1.576-2.84l-1.284-4.03-2.284 4.03zm-3.353-1.678l1.804-3.184-.656-2.06zm.349 2.319h3.208l.8 2.51zm9.508-2.32l-1.804-3.183.656-2.06zm-1.445-6.42l-.789 2.478-2.371-4.185V4.338z", clipRule: "evenodd" }));
}
EOS.DefaultColor = DefaultColor;
var EOS_default = EOS;
//# sourceMappingURL=EOS.js.map
