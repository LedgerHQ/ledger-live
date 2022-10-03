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
  default: () => TBX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function TBX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.775 20.55A8.775 8.775 0 013 11.775 8.775 8.775 0 0111.775 3a8.775 8.775 0 018.775 8.775 8.775 8.775 0 01-8.775 8.775zm2.168-5.775l-2.168-3-2.168 3-1.762-3 1.965-3.36h3.93l1.965 3.36-1.762 3zm.645-7.8H8.963l-2.805 4.8 2.812 4.8h5.617l2.805-4.8-2.804-4.8z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 20.775A8.775 8.775 0 013.225 12 8.775 8.775 0 0112 3.225 8.775 8.775 0 0120.775 12 8.775 8.775 0 0112 20.775zM14.168 15L12 12l-2.167 3-1.763-3 1.965-3.36h3.93L15.93 12l-1.762 3zm.645-7.8H9.188L6.383 12l2.812 4.8h5.617l2.806-4.8-2.805-4.8z"
  }));
}
TBX.DefaultColor = DefaultColor;
var TBX_default = TBX;
//# sourceMappingURL=TBX.js.map
