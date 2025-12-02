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
var GNT_exports = {};
__export(GNT_exports, {
  default: () => GNT_default
});
module.exports = __toCommonJS(GNT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#001d57";
function GNT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M14.924 4.046l.902.903-1.708 1.755a3.4 3.4 0 01.553 1.859 3.34 3.34 0 01-.943 2.348 3.14 3.14 0 01-1.663.92v1.529c.633.13 1.212.45 1.66.915.613.629.953 1.474.947 2.352a3.34 3.34 0 01-.947 2.351 3.2 3.2 0 01-2.302.976 3.18 3.18 0 01-2.303-.976 3.36 3.36 0 01-.946-2.351c0-.885.336-1.724.944-2.35a3.14 3.14 0 011.662-.918v-1.53a3.2 3.2 0 01-1.66-.915 3.36 3.36 0 01-.946-2.352c0-.885.336-1.724.947-2.351a3.2 3.2 0 012.302-.977c.645 0 1.265.196 1.797.561zm-3.5 10.542a1.9 1.9 0 00-1.393.593 2.06 2.06 0 00-.582 1.446c0 .544.207 1.051.582 1.445a1.936 1.936 0 002.784 0c.375-.387.584-.906.582-1.445 0-.544-.207-1.052-.584-1.448a1.9 1.9 0 00-1.39-.59m1.389-4.567c.377-.388.586-.908.583-1.448a2.02 2.02 0 00-.58-1.446 1.93 1.93 0 00-1.393-.593 1.9 1.9 0 00-1.392.593 2.06 2.06 0 00-.582 1.446c0 .543.207 1.051.582 1.445a1.936 1.936 0 002.782.003" }));
}
GNT.DefaultColor = DefaultColor;
var GNT_default = GNT;
//# sourceMappingURL=GNT.js.map
