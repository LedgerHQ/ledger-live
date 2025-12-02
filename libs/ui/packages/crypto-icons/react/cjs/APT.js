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
var APT_exports = {};
__export(APT_exports, {
  default: () => APT_default
});
module.exports = __toCommonJS(APT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function APT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M15.246 4.794c.096 0 .192-.02.277-.059a.7.7 0 00.233-.159l1.022-1.057A.6.6 0 0117 3.367a.6.6 0 01.266-.055h.047q.144.002.277.059c.087.04.167.098.229.169l.862.964a.88.88 0 00.648.285h2.304A12.05 12.05 0 0012.007.001c-1.867 0-3.711.433-5.381 1.263a12 12 0 00-4.248 3.525h12.876zm1.218 3.236h6.904c.338.954.548 1.948.632 2.959h-8.949a.9.9 0 01-.358-.073.9.9 0 01-.289-.214l-.863-.967a.7.7 0 00-.228-.166.8.8 0 00-.277-.057h-.042a.68.68 0 00-.49.207l-1.024 1.059a.7.7 0 01-.51.219H0a12 12 0 01.631-2.959h11.618c.18 0 .358-.037.524-.111q.25-.112.431-.317l.74-.832a.65.65 0 01.227-.164.7.7 0 01.28-.057c.094 0 .19.021.277.057a.65.65 0 01.226.164l.865.969a.86.86 0 00.645.291zm-9.549 9.124a.7.7 0 01-.276.059l-5.485.008a12 12 0 01-.989-2.988h7.813a1.3 1.3 0 00.954-.428l.738-.829a.7.7 0 01.23-.169.56.56 0 01.276-.057.65.65 0 01.278.06.8.8 0 01.228.171l.863.964a.8.8 0 00.291.211.85.85 0 00.352.077h11.65a11.8 11.8 0 01-.993 2.98H10.71a.9.9 0 01-.356-.08.8.8 0 01-.289-.214l-.859-.966a.7.7 0 00-.229-.166.7.7 0 00-.278-.057h-.045a.7.7 0 00-.489.206l-1.021 1.063a.7.7 0 01-.232.159zm.544 3.018h3.156l10.199.017a12.1 12.1 0 01-4.003 2.817 12.1 12.1 0 01-9.601 0 12.1 12.1 0 01-4.002-2.817h.046a1.27 1.27 0 00.954-.43l.741-.846a.67.67 0 01.506-.222.66.66 0 01.506.222l.858.966q.122.138.292.215a.9.9 0 00.353.078z", clipRule: "evenodd" }));
}
APT.DefaultColor = DefaultColor;
var APT_default = APT;
//# sourceMappingURL=APT.js.map
