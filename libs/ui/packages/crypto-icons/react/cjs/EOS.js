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
  default: () => EOS_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#000";
function EOS({
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
    d: "M12 3.039a.32.32 0 01.26.13l3.836 5.24a.32.32 0 01.054.12l1.856 8.478a.32.32 0 01-.143.34l-5.69 3.565a.32.32 0 01-.173.05.32.32 0 01-.172-.05l-5.692-3.565a.32.32 0 01-.142-.34L7.849 8.53a.32.32 0 01.055-.12l3.835-5.24A.32.32 0 0112 3.039zm-.323 1.299l-3.16 4.318.788 2.479 2.372-4.186V4.338zM12 7.678l-2.43 4.288 1.526 4.79h1.808l1.526-4.791L12 7.678zm2.86 5.046l-1.284 4.032h3.568l-2.284-4.032zm1.72 4.672h-3.208l-.8 2.51 4.008-2.51zM12 19.595l.7-2.2h-1.4l.7 2.2zm-1.576-2.84l-1.284-4.03-2.284 4.03h3.568zm-3.353-1.678l1.804-3.184-.656-2.06-1.148 5.243zm.349 2.319h3.208l.8 2.51-4.008-2.51zm9.508-2.32l-1.804-3.183.656-2.06 1.148 5.243zm-1.445-6.42l-.789 2.478-2.371-4.185V4.338l3.16 4.318z"
  }));
}
EOS.DefaultColor = DefaultColor;
var EOS_default = EOS;
//# sourceMappingURL=EOS.js.map
