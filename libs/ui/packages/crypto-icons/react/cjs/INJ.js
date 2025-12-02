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
var INJ_exports = {};
__export(INJ_exports, {
  default: () => INJ_default
});
module.exports = __toCommonJS(INJ_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#0bd";
function INJ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 600 600", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M148.497 169.135c2.484-3.122 5.116-6.126 7.748-9.13.118-.149.385-.179.503-.328.237-.297.622-.476.858-.774l.237-.297c1.835-1.696 3.787-3.542 6.038-5.15 7.964-6.046 16.229-10.639 24.944-13.661 27.953-9.814 59.069-3.766 83.47 19.27 34.071 31.937 31.02 83.386 3.822 117.582-34.369 50.978-93.433 122.101-11.654 185.813 14.704 11.456 25.612 20.901 71.929 34.286-30.292 5.58-58.38 3.844-89.644-4.141-22.114-12.482-56.882-39.208-68.711-75.305-17.878-54.738 31.476-136.568 55.328-168.084 32.748-43.617-20.241-90.834-59.253-38.121-20.392 27.471-56.068 105.208-43.67 162.87 7.249 32.699 16.911 56.534 55.221 89.276q-10.656-6.287-20.695-14.267c-89.011-82.914-78.684-211.115-16.471-279.839" }), /* @__PURE__ */ React.createElement("path", { d: "M451.503 430.865c-2.484 3.122-5.116 6.126-7.748 9.13-.118.149-.385.179-.503.328-.237.297-.622.476-.858.774l-.237.297c-1.835 1.696-3.787 3.542-6.038 5.15-7.964 6.046-16.229 10.639-24.944 13.661-27.953 9.814-59.069 3.766-83.47-19.27-34.071-31.937-31.02-83.386-3.822-117.582 34.369-50.978 93.433-122.101 11.654-185.813-14.704-11.456-25.612-20.901-71.929-34.286 30.292-5.58 58.38-3.845 89.643 4.141 22.115 12.482 56.883 39.208 68.712 75.305 17.878 54.738-31.476 136.568-55.328 168.084-32.748 43.617 20.241 90.834 59.253 38.121 20.392-27.471 56.068-105.208 43.67-162.87-7.249-32.699-16.911-56.534-55.221-89.276q10.656 6.287 20.695 14.267c89.011 82.914 78.684 211.115 16.471 279.839" }));
}
INJ.DefaultColor = DefaultColor;
var INJ_default = INJ;
//# sourceMappingURL=INJ.js.map
