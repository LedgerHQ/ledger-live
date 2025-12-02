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
var EXP_exports = {};
__export(EXP_exports, {
  default: () => EXP_default
});
module.exports = __toCommonJS(EXP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ffaa5c";
function EXP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M19.5 11.038q-.006.043-.008.087l-.009 2.746-.003 1.88c0 .06-.005.12-.009.196q-.046-.02-.079-.038l-3.49-1.946c-.063-.035-.068-.065-.038-.127q.891-1.832.011-3.669c-.027-.059-.022-.088.038-.12l3.492-1.96c.029-.017.063-.025.095-.037zM12.225 3.75l.176.107 6.787 3.813c.026.014.05.03.085.051-.032.02-.053.035-.076.048l-3.463 1.935c-.091.05-.09.049-.15-.037q-1.152-1.613-3.16-1.847a1 1 0 00-.12-.007c-.07 0-.097-.027-.097-.101q-.002-1.14-.008-2.28l-.002-1.575c0-.036.009-.071.013-.107zm-.465 16.5c-.025-.019-.049-.04-.075-.055l-6.838-3.843-.107-.064c.03-.02.05-.035.072-.048q1.721-.961 3.443-1.925c.068-.039.1-.024.143.036.718.994 1.697 1.582 2.926 1.782q.19.028.38.036c.072.003.101.023.101.098q0 1.009.005 2.017l.003 1.91q-.002.027-.008.056zM4.5 15.338c.004-.023.011-.046.012-.07l.003-.947.005-2.12.01-3.344.004-.721c0-.021.003-.042.005-.076l.08.038q1.711.957 3.425 1.911c.066.037.075.066.042.136-.6 1.23-.597 2.463 0 3.695.05.099.05.098-.047.153q-1.719.967-3.438 1.931c-.03.017-.068.018-.101.026zm10.105-.698c.122-.43.162-.863.135-1.302a3.3 3.3 0 00-.446-1.52c-.322-.541-.789-.933-1.357-1.218-.15-.076-.167-.038-.077-.225.201-.422.555-.685.99-.853.302-.11.62-.173.943-.184a.18.18 0 01.12.054c.54.563.891 1.281 1.003 2.054.288 1.955-.986 3.79-2.965 4.276-2.195.54-4.422-.811-4.878-2.958-.426-2.009.861-3.952 2.781-4.465 1.442-.385 2.722-.078 3.842.877l.126.108-.015.024c-.11-.013-.22-.03-.33-.04-.685-.065-1.359-.02-2.012.204a3.35 3.35 0 00-1.881 1.564c-.06.107-.064.107-.18.068a1 1 0 01-.39-.253 2.1 2.1 0 01-.471-.78c-.088-.254-.152-.517-.227-.775-.006-.02-.01-.042-.029-.063l-.031.178q-.014.09-.023.18c-.071.67-.033 1.33.199 1.97q.433 1.198 1.622 1.722c.104.046.104.047.048.141-.293.498-.753.749-1.32.834-.264.04-.528.024-.798.005l.074.03c1.297.446 2.722.246 3.796-.89q.406-.434.703-.95c.051-.088.055-.09.137-.03.352.257.561.608.705 1.002.135.362.188.739.2 1.122zm4.7 1.659l-7.096 3.937c-.004-.041-.01-.067-.01-.092l-.001-3.892c0-.058.017-.079.08-.084q2.071-.17 3.277-1.817c.07-.097.069-.098.172-.04l3.483 1.931zm-7.5-12.522c.002.042.004.067.004.093l.001 3.84c0 .06-.009.09-.082.095q-2.114.153-3.338 1.832c-.065.089-.064.09-.158.037l-3.39-1.882q-.059-.036-.115-.075c.038-.027.074-.058.116-.081l6.833-3.792.127-.067z", clipRule: "evenodd" }));
}
EXP.DefaultColor = DefaultColor;
var EXP_default = EXP;
//# sourceMappingURL=EXP.js.map
