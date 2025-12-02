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
var EDO_exports = {};
__export(EDO_exports, {
  default: () => EDO_default
});
module.exports = __toCommonJS(EDO_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#242424";
function EDO({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.795 17.906l2.012-2.023 2.02 2.023-1.288 1.291a1.035 1.035 0 01-1.463 0zm5.213-6.932l-2.02-2.023 2.02-2.022 2.02 2.022zm-.502 6.272l-2.02-2.022 5.422-5.432 1.289 1.29c.404.406.404 1.06 0 1.465zm-5.553-.208l-2.019-2.023 5.414-5.422 2.019 2.022zm-2.866-2.85l-1.29-1.292a1.037 1.037 0 01.01-1.464l1.289-1.291 2.02 2.023zm8.075-8.091L8.74 11.525 6.72 9.503l4.691-4.7a1.03 1.03 0 011.463 0z" }));
}
EDO.DefaultColor = DefaultColor;
var EDO_default = EDO;
//# sourceMappingURL=EDO.js.map
