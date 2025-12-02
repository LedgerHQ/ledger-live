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
var BURN_exports = {};
__export(BURN_exports, {
  default: () => BURN_default
});
module.exports = __toCommonJS(BURN_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#fff";
function BURN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 100 100", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M40.865 87.109c-6.06-1.023-18.77-6.617-21.126-20.81-2.035-12.257 4.663-20.698 10.48-28.028 2.605-3.283 5.033-6.343 6.421-9.423 2.171-4.816 2.88-9.534 2.955-13.142.044-2.107 2.421-3.718 4.15-2.513 3.904 2.721 8.717 6.765 11.691 11.353 2.867 4.422 4.654 8.368 5.65 11.111.438 1.203 2.082 1.47 2.64.318.766-1.581 1.52-3.58 1.85-5.693.255-1.627.27-3.18.169-4.524-.077-1.029 1.386-1.828 2.069-1.055 3.391 3.837 7.906 9.951 10.22 16.472 3.824 10.777 7.3 25.379-3.071 36.62-5.988 6.489-12.638 8.843-17.284 9.425 1.327-.763 2.761-1.877 4.233-3.473 5.349-5.796 4.96-13.417 2.987-18.974-1.207-3.404-3.756-6.616-5.596-8.6-.35-.378-1.238.058-1.246.573-.012.745-.08 1.61-.218 2.494a9 9 0 01-.268 1.186c-.364 1.228-1.859.962-2.265-.252a19.4 19.4 0 00-2.117-4.396c-1.912-2.95-4.877-4.999-6.864-6.16-.364-.212-.84.125-.826.546.06 1.945-.415 5.368-1.926 8.72-.753 1.672-2.144 3.238-3.624 4.904-3.067 3.452-6.52 7.34-5.496 13.51.8 4.82 4.536 8.04 7.886 9.826z", clipRule: "evenodd" }));
}
BURN.DefaultColor = DefaultColor;
var BURN_default = BURN;
//# sourceMappingURL=BURN.js.map
