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
var NEU_exports = {};
__export(NEU_exports, {
  default: () => NEU_default
});
module.exports = __toCommonJS(NEU_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#b3ba00";
function NEU({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { d: "M9.848 7.998l-.098.06L14.25 15V8.051L12.003 6.75zm-.098 7.876l2.352 1.376 2.148-1.254L9.75 9zM7.5 9.267v5.466L9 15.75v-7.5zM15 15.75l1.5-1.04V9.29L15 8.25z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3c-4.969 0-9 4.031-9 9s4.031 9 9 9 9-4.031 9-9-4.031-9-9-9m-.037 14.715l-4.857-2.88V9.084l4.857-2.872 4.857 2.872v5.752z" }), /* @__PURE__ */ React.createElement("path", { d: "M9.848 7.998l-.098.06L14.25 15V8.051L12.003 6.75zm-.098 7.876l2.352 1.376 2.148-1.254L9.75 9zM7.5 9.267v5.466L9 15.75v-7.5zM15 15.75l1.5-1.04V9.29L15 8.25z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3c-4.969 0-9 4.031-9 9s4.031 9 9 9 9-4.031 9-9-4.031-9-9-9m-.037 14.715l-4.857-2.88V9.084l4.857-2.872 4.857 2.872v5.752z" }));
}
NEU.DefaultColor = DefaultColor;
var NEU_default = NEU;
//# sourceMappingURL=NEU.js.map
