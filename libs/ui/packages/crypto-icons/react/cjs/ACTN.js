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
  default: () => ACTN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "red";
function ACTN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M3.304 17.963l4.003-7.288c.166-.304.441-.386.72-.222h.03a.527.527 0 00.744-.218l2.812-4.309a2.15 2.15 0 01.36-.496c.126.154.22.332.275.523l1.215 3.01c.276.692.938 1.188 1.63 1.188h.219c.355.014.69.162.94.414l.882.938c.261.277.502.572.72.884l2.844 4.086c.106.162.207.328.302.497v.027a2.52 2.52 0 01-.414-.407l-3.838-3.982a3.833 3.833 0 01-.608-.8c-.306-.663-.692-.94-1.298-.911h-.772c-.468 0-.58-.083-.72-.553l-1.102-3.45c-.192-.692-.221-.692-.414 0l-.745 2.34c-.165.467-.222 1.241-.138 1.241.028 0 .221-.36.525-.994.057-.129.131-.25.22-.36.07.264.107.536.112.809a4.82 4.82 0 01-.277.553l-.027.082c-.332.607-.332.636.027 1.215l.33.552c.126.169.228.355.305.551a4.087 4.087 0 01-.498.36l-1.711 1.104a2.25 2.25 0 01-.994.276c-.608-.027-1.132.277-1.602.91l-.662.94a5.464 5.464 0 01-.801.801l-.607.496a5.757 5.757 0 01-.994.553l-.33.083c-.24.087-.492.142-.746.164-.113 0-.221 0-.221-.027.086-.201.188-.395.304-.58z"
  }));
}
ACTN.DefaultColor = DefaultColor;
var ACTN_default = ACTN;
//# sourceMappingURL=ACTN.js.map
