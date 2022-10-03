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
  default: () => KRB_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#00AEEF";
function KRB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.07 11.03c.178-.031.336-.098.474-.2.138-.1.268-.271.39-.505l2.72-5.24a1.45 1.45 0 01.386-.425.9.9 0 01.526-.16h1.724l-3.386 6.164c-.15.253-.32.46-.51.62-.19.157-.405.28-.638.361.363.094.667.246.915.46.245.21.478.507.695.889l3.259 6.506h-1.898c-.383 0-.691-.206-.924-.615l-2.671-5.513c-.138-.246-.288-.42-.45-.527a1.257 1.257 0 00-.611-.183v2.798H9.579v-2.81H8.482v6.85H6.375v-15h2.107v6.554H9.58V7.812h1.492v3.218h-.001z"
  }));
}
KRB.DefaultColor = DefaultColor;
var KRB_default = KRB;
//# sourceMappingURL=KRB.js.map
