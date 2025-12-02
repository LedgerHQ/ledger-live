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
var DATA_exports = {};
__export(DATA_exports, {
  default: () => DATA_default
});
module.exports = __toCommonJS(DATA_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#e9570f";
function DATA({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M18.109 7.44l1.205-1.196c.285-.282.226-.798-.13-1.152-.357-.354-.878-.411-1.162-.129L15.76 7.206l-.078.077-1.97 1.954a3.42 3.42 0 00-4.4.337 3.35 3.35 0 00-.341 4.363L7.466 15.43a5.9 5.9 0 01-.892-1.72c-.504-1.529-.369-3.203.45-4.583 1.278-2.152 3.563-3.088 5.729-2.814a.8.8 0 00.912-.74.98.98 0 00-.88-1.03 7.53 7.53 0 00-6.087 2.135c-2.752 2.728-2.914 7.057-.495 10.003l-1.38 1.37c-.272.27-.205.775.152 1.129.357.353.867.421 1.139.151L7.6 17.858l1.075-1.065.002-.003 1.741-1.726a3.42 3.42 0 003.69-.732 3.35 3.35 0 00.739-3.66l1.976-1.958c1.448 2.181 1.16 5.2-.833 7.176a5.9 5.9 0 01-4.597 1.71.734.734 0 00-.773.665l-.021.24a.78.78 0 00.743.848 7.73 7.73 0 005.874-2.247c2.698-2.675 3.01-6.796.893-9.668zm-5.251 5.65a1.635 1.635 0 01-2.295 0 1.6 1.6 0 010-2.274 1.634 1.634 0 012.295 0 1.6 1.6 0 010 2.274" }));
}
DATA.DefaultColor = DefaultColor;
var DATA_default = DATA;
//# sourceMappingURL=DATA.js.map
