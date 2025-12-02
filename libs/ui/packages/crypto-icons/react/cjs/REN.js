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
var REN_exports = {};
__export(REN_exports, {
  default: () => REN_default
});
module.exports = __toCommonJS(REN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#080817";
function REN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M7.106 7.366l1.173-.676.166.273 4.35-2.513-.32-.19-.321-.177L12 3.988 4.9 8.09v.177l2.04-1.174zm0 2.583l3.412-1.967.154.274 4.362-2.514-.319-.19-.32-.177-.155-.095-9.34 5.38v.19l2.04-1.173zm0 1.292l4.527-2.618.153.272 4.363-2.512-.32-.179-.322-.19-.153-.095-10.453 6.034v.188l2.038-1.184zm0 1.28l5.676-3.272.155.275 4.327-2.501-.322-.18-.32-.187-.154-.085-11.567 6.674v.177l2.038-1.173zm0 1.292l6.79-3.922.155.285 4.327-2.5-.323-.191-.305-.179-.167-.094-12.682 7.325v.177l2.038-1.173zm11.756-5.866l-.165-.095L4.9 15.828v.177l2.038-1.173.167.273 6.79-3.923.155.273 5.05-2.903V8.09zM5.778 16.79l1.138-.652.166.273 6.78-3.923.165.283L19.1 9.83v-.91L5.623 16.695zm8.084-3.01l.165.285 5.073-2.94v-.913L6.737 17.346l.153.095 1.163-.676.164.272zm-5.856 4.3l1.173-.675.153.285 4.53-2.62.164.271 5.073-2.926v-.924L7.852 17.986zm1.126.64l1.162-.664.153.273 3.415-1.968.165.272 5.073-2.927v-.924L8.965 18.638zm.948.557l.166.095 1.162-.677.153.285 2.3-1.327.165.274 5.073-2.93v-.922zm1.28.734l1.163-.663.164.272 1.175-.687.165.285L19.1 16.29v-.924l-7.895 4.564zM13.92 5.09l-.32-.177-.32-.19-.165-.095L4.9 9.38v.177l2.038-1.173.167.272L9.404 7.33l.156.272z" }));
}
REN.DefaultColor = DefaultColor;
var REN_default = REN;
//# sourceMappingURL=REN.js.map
