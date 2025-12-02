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
var FTM_exports = {};
__export(FTM_exports, {
  default: () => FTM_default
});
module.exports = __toCommonJS(FTM_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function FTM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M11.013.903c.549-.289 1.383-.289 1.93 0l5.594 2.95c.33.173.512.433.544.7h.006v14.823c-.008.292-.19.582-.55.772l-5.593 2.949c-.548.289-1.382.289-1.93 0l-5.594-2.95c-.358-.188-.53-.48-.538-.77V4.552h.003c.024-.27.198-.523.535-.7zm7.184 11.891l-5.255 2.78c-.547.29-1.38.29-1.928 0L5.771 12.8v6.53l5.243 2.758c.31.166.632.327.946.334h.018c.313.002.617-.158.926-.308l5.293-2.808zM4.005 19.055c0 .568.066.942.196 1.205.107.218.269.385.564.587l.017.012a7 7 0 00.223.144l.102.064.315.191-.451.752-.352-.214-.06-.037a8 8 0 01-.264-.171c-.841-.572-1.155-1.196-1.161-2.494v-.039zm7.55-10.201a1 1 0 00-.114.049L5.856 11.86l-.016.01-.005.002.009.005.012.007 5.585 2.958a1 1 0 00.114.049zm.89 0v6.038a1 1 0 00.114-.049l5.585-2.958.016-.01.005-.002-.009-.005-.012-.007-5.585-2.958a1 1 0 00-.114-.05m5.752-3.242L13.176 8.25l5.02 2.638zm-12.426 0v5.276l5.021-2.638zm6.783-3.92c-.291-.154-.817-.154-1.108 0l-5.59 2.955-.016.01-.005.002.009.005.012.007 5.59 2.955c.291.154.817.154 1.108 0l5.59-2.955.016-.01.005-.002-.009-.005-.012-.007zm6.475.298l.352.214.06.037c.101.063.186.118.264.171.841.572 1.155 1.196 1.161 2.494v.04h-.871c0-.57-.066-.943-.196-1.206-.107-.218-.269-.385-.564-.587l-.017-.012a7 7 0 00-.223-.144l-.102-.064-.315-.191z" }));
}
FTM.DefaultColor = DefaultColor;
var FTM_default = FTM;
//# sourceMappingURL=FTM.js.map
