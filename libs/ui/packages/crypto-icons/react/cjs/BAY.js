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
var BAY_exports = {};
__export(BAY_exports, {
  default: () => BAY_default
});
module.exports = __toCommonJS(BAY_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#6356ab";
function BAY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M17.088 11.98q.066-.072.141-.146c.158-.17.33-.35.493-.525a3.66 3.66 0 001.017-2.527c0-.066.011-.334.011-.372-.076-2.154-1.89-3.91-4.033-3.91h-6.75v2.723H5.25V19.5h9.575c2.128 0 3.925-1.892 3.925-4.134.005-1.603-.985-2.734-1.662-3.386M9.32 8.59l5.375.006-3.377 3.424 3.34 3.39H9.32zm5.505 9.538H6.603V8.585h1.365v8.186h6.69c.552 0 1.045-.333 1.256-.847a1.37 1.37 0 00-.293-1.493l-2.386-2.417 2.424-2.456c.39-.394.504-.979.293-1.492a1.36 1.36 0 00-1.257-.848h-5.37V5.862h5.398c1.429 0 2.63 1.165 2.68 2.58 0 .06-.012.296-.012.301v.027a2.3 2.3 0 01-.643 1.592c-.169.175-.342.36-.498.525-.266.279-.493.52-.602.63l-.487.48.482.488q.098.096.243.234c.563.525 1.511 1.4 1.511 2.636.005 1.476-1.196 2.773-2.572 2.773" }));
}
BAY.DefaultColor = DefaultColor;
var BAY_default = BAY;
//# sourceMappingURL=BAY.js.map
