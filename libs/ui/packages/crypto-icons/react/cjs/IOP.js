var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => IOP_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0CAFA5";
function IOP({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M6.31 7.469c-.025-.015-.045-.003-.045.026v1.727a.1.1 0 00.045.078l2.183 1.262a.1.1 0 01.045.079v6.247a.101.101 0 00.046.079l1.495.862c.025.015.045.003.045-.026V9.726a.1.1 0 00-.045-.08L6.31 7.47zm11.38 0c.025-.015.046-.003.046.026v1.727a.1.1 0 01-.045.078l-2.183 1.26a.1.1 0 00-.045.08v6.247a.101.101 0 01-.046.08l-1.494.862c-.026.015-.046.003-.046-.026V9.726a.1.1 0 01.045-.08L17.69 7.47z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M17.985 4.157c0-.029-.02-.04-.045-.026L12.045 7.54a.1.1 0 01-.09 0L6.06 4.13c-.025-.014-.045-.002-.045.027v1.726a.1.1 0 00.045.079l5.103 2.95a.101.101 0 01.045.08v10.713a.101.101 0 00.045.08l.702.404a.103.103 0 00.091 0l.701-.404a.101.101 0 00.045-.08V8.992a.101.101 0 01.046-.079l5.102-2.951a.102.102 0 00.045-.08V4.158zm-5.958 4.362c-.006 0-.008-.005-.005-.01s.008-.005.01 0c.004.005 0 .01-.005.01z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.26 3.931a.066.066 0 00-.052.063V6.15a.101.101 0 00.046.079l.7.405a.099.099 0 00.092 0l.702-.405a.101.101 0 00.045-.08V3.994a.065.065 0 00-.051-.063l-.69-.126a.343.343 0 00-.103 0l-.69.127z"
  }));
}
IOP.DefaultColor = DefaultColor;
var IOP_default = IOP;
//# sourceMappingURL=IOP.js.map
