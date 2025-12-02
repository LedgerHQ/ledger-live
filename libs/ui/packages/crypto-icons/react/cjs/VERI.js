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
var VERI_exports = {};
__export(VERI_exports, {
  default: () => VERI_default
});
module.exports = __toCommonJS(VERI_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#f93";
function VERI({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M4.5 6q1.243.003 2.484 0l1.568 8.385q.038.185.087.368c.123-.488.2-.986.303-1.478L10.37 6h2.403q-1.321 5.888-2.645 11.774H7.145L4.5 6.008zm9.236 3.7c.522-.658 1.358-.956 2.163-1.008.795-.056 1.652.016 2.325.49.596.417.924 1.122 1.079 1.824.188.879.198 1.782.197 2.677h-4.402c.003.662-.038 1.346.183 1.98.107.312.308.623.626.736.339.11.747.038.994-.235.33-.373.4-.897.471-1.376h1.998c-.045.795-.192 1.635-.712 2.26-.522.65-1.364.915-2.16.947-.866.033-1.806-.085-2.496-.668-.64-.534-.92-1.382-1.032-2.194a16.3 16.3 0 01-.065-2.822c.07-.916.236-1.887.83-2.613zm1.705.933c-.34.49-.35 1.122-.344 1.7h2.275c-.036-.55-.032-1.13-.28-1.633-.307-.621-1.279-.624-1.65-.066z" }));
}
VERI.DefaultColor = DefaultColor;
var VERI_default = VERI;
//# sourceMappingURL=VERI.js.map
