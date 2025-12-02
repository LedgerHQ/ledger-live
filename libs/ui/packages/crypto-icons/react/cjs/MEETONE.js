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
var MEETONE_exports = {};
__export(MEETONE_exports, {
  default: () => MEETONE_default
});
module.exports = __toCommonJS(MEETONE_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function MEETONE({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillOpacity: 0.7, d: "M6.483 16.985l5.217 3.282h.631l5.133-3.282-.8-.63-4.67 2.987-4.838-2.987zm2.524-7.614l2.946-4.46 3.029 4.502.715-.632-3.366-5.048s-.294-.379-.757 0l-3.45 5.175z" }), /* @__PURE__ */ React.createElement("path", { d: "M12.037 18.374c.167-.59.378-1.136.547-1.725.758-2.356 1.514-4.755 2.272-7.11.042-.126.084-.295.126-.42.084-.254.21-.38.463-.38a.46.46 0 01.462.379c.21.841.379 1.725.589 2.566.379 1.6.716 3.24 1.094 4.839.084.378-.042.631-.337.715-.294.084-.504-.126-.588-.505a209 209 0 01-1.22-5.47c0-.083-.043-.125-.085-.252a3 3 0 01-.126.337c-.799 2.44-1.556 4.88-2.356 7.32-.126.463-.295.884-.42 1.347-.085.294-.254.42-.505.42-.253 0-.421-.126-.505-.42-.926-2.903-1.852-5.806-2.735-8.71-.042-.083-.042-.125-.084-.294q-.114.571-.252 1.136c-.338 1.515-.674 3.071-1.01 4.586-.085.42-.42.631-.758.42-.21-.126-.252-.336-.21-.588.463-2.104.967-4.208 1.43-6.31.084-.338.169-.674.21-1.011q.127-.505.506-.505.378 0 .504.505a779 779 0 012.862 9.13z" }));
}
MEETONE.DefaultColor = DefaultColor;
var MEETONE_default = MEETONE;
//# sourceMappingURL=MEETONE.js.map
