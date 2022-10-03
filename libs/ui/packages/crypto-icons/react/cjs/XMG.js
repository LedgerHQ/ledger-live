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
  default: () => XMG_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function XMG({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593c-.39-.727-.722-1.27-.996-1.631-.273-.361-.517-.585-.731-.675a2.008 2.008 0 00-.626-.157 8.164 8.164 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554c.273 0 .523-.065.75-.195.226-.13.423-.294.588-.49.175-.203.33-.423.462-.655.142-.247.267-.503.373-.767l.556.17z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593c-.39-.727-.722-1.27-.996-1.631-.273-.361-.517-.585-.731-.675a2.008 2.008 0 00-.626-.157 8.164 8.164 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554c.273 0 .523-.065.75-.195.226-.13.423-.294.588-.49.175-.203.33-.423.462-.655.142-.247.267-.503.373-.767l.556.17z"
  }));
}
XMG.DefaultColor = DefaultColor;
var XMG_default = XMG;
//# sourceMappingURL=XMG.js.map
