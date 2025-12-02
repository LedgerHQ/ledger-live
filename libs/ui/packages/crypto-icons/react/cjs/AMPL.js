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
var AMPL_exports = {};
__export(AMPL_exports, {
  default: () => AMPL_default
});
module.exports = __toCommonJS(AMPL_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#000";
function AMPL({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M5.633 18.375a5 5 0 01-.001-.532q.09-.027.184-.037.273-.047.538-.126.073-.021.142-.049a1.43 1.43 0 00.594-.427q.162-.2.284-.427.17-.311.304-.64.271-.661.54-1.327l1.845-4.57a305 305 0 001.715-4.356q.017-.045.037-.089c.207-.057.41-.115.622-.17l.034.082.713 1.951a689 689 0 002.454 6.64q.342.907.69 1.81.136.37.321.718.081.15.176.29c.192.294.492.507.838.594q.28.073.565.11l.136.02c.02.059.007.116.009.172.002.057 0 .12 0 .18q.002.089-.003.175l-.05.008h-4.772a.1.1 0 01-.01-.032v-.48l.005-.02q.06-.017.121-.023.295-.038.582-.111.115-.033.227-.075a1 1 0 00.108-.053c.189-.103.264-.265.248-.472a1.6 1.6 0 00-.05-.278c-.038-.142-.09-.28-.14-.417q-1.482-4.051-2.933-8.115c-.01-.03-.013-.062-.044-.089-.01.006-.023.01-.03.019a.2.2 0 00-.018.044c-.473 1.332-.976 2.653-1.478 3.975-.37.979-.74 1.957-1.085 2.945q-.207.594-.401 1.192-.077.229-.113.467a1.1 1.1 0 00-.009.32.5.5 0 00.207.35 1 1 0 00.25.126q.211.072.433.109c.163.03.327.052.491.077l.035.006.008.036v.464l-.006.027-.045.007z" }));
}
AMPL.DefaultColor = DefaultColor;
var AMPL_default = AMPL;
//# sourceMappingURL=AMPL.js.map
