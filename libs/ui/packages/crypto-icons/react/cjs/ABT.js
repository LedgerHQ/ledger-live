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
var ABT_exports = {};
__export(ABT_exports, {
  default: () => ABT_default
});
module.exports = __toCommonJS(ABT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#3effff";
function ABT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M4.875 7.865L12 3.75l7.125 4.115v8.27L12 20.25l-7.125-4.115zm.684 7.478l2.857-1.654 1.45-2.539L5.56 8.658zm.343.593l5.776 3.337V16.08L8.65 14.345zM18.44 8.681l-4.269 2.47 1.449 2.537 2.82 1.631zm-.322-.606l-5.757-3.324v3.231l1.47 2.574zm-4.536 3.417l-.879.508 1.744 1.009zm-.34-.596l-.88-1.545v2.055zm-3.648 2.111L11.336 12l-.876-.507-.863 1.514m-.259.942l2.342 1.341v-2.696zM5.901 8.064l4.305 2.49 1.472-2.576v-3.25zm12.218 7.86l-2.727-1.577-3.03 1.755v3.148zm-3.411-1.973l-2.346-1.357v2.717l2.345-1.361m-3.91-3.053l.88.508v-2.05z" }));
}
ABT.DefaultColor = DefaultColor;
var ABT_default = ABT;
//# sourceMappingURL=ABT.js.map
