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
var XCP_exports = {};
__export(XCP_exports, {
  default: () => XCP_default
});
module.exports = __toCommonJS(XCP_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#ed1650";
function XCP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M17.623 6.759H14.59a.46.46 0 00-.33.14l-5.53 5.646a.46.46 0 01-.33.14H7.385a.46.46 0 01-.33-.14l-.717-.73a.48.48 0 01-.137-.335v-1.033a.48.48 0 01.137-.336l.717-.73a.46.46 0 01.33-.14h1.014a.46.46 0 01.33.14l.44.448a.46.46 0 00.66 0l1.064-1.083a.48.48 0 000-.672L9.738 6.899a.46.46 0 00-.33-.14H6.375a.46.46 0 00-.33.14L3.9 9.083a.48.48 0 00-.136.336v3.088c0 .126.05.248.136.336l2.145 2.185a.46.46 0 00.33.138H9.41a.46.46 0 00.33-.139l5.531-5.646a.46.46 0 01.33-.14h1.014c.124 0 .243.05.33.14l.717.73a.48.48 0 01.138.336v1.033a.48.48 0 01-.138.335l-.717.73a.46.46 0 01-.33.14H15.6a.46.46 0 01-.33-.14l-.444-.452a.46.46 0 00-.656-.004l-1.312 1.307a.48.48 0 00-.14.34v3.03c0 .262.209.475.466.475h1.53a.47.47 0 00.467-.475v-1.125a.47.47 0 01.467-.475h1.976a.46.46 0 00.33-.138l2.145-2.185a.48.48 0 00.137-.336V9.419a.48.48 0 00-.136-.336l-2.145-2.184a.46.46 0 00-.33-.14", clipRule: "evenodd" }));
}
XCP.DefaultColor = DefaultColor;
var XCP_default = XCP;
//# sourceMappingURL=XCP.js.map
