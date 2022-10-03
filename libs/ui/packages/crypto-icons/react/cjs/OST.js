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
  default: () => OST_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#34445B";
function OST({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.684 8.728l1.507-2.352a1.523 1.523 0 00.623-2.977 1.522 1.522 0 00-1.53 2.4l-1.87 2.918a5.97 5.97 0 00-3.201 10.56 5.974 5.974 0 008.404-.829 5.974 5.974 0 001.327-4.374 5.976 5.976 0 00-5.26-5.346zm-.686 9.092a3.165 3.165 0 01-2.928-4.38 3.165 3.165 0 014.729-1.393c.529.366.934.884 1.161 1.487a1.831 1.831 0 00-2.893 2.243 1.83 1.83 0 002.887.005 3.161 3.161 0 01-2.956 2.038z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12.684 8.728l1.507-2.352a1.523 1.523 0 00.623-2.977 1.522 1.522 0 00-1.53 2.4l-1.87 2.918a5.97 5.97 0 00-3.201 10.56 5.974 5.974 0 008.404-.829 5.974 5.974 0 001.327-4.374 5.976 5.976 0 00-5.26-5.346zm-.686 9.092a3.165 3.165 0 01-2.928-4.38 3.165 3.165 0 014.729-1.393c.529.366.934.884 1.161 1.487a1.831 1.831 0 00-2.893 2.243 1.83 1.83 0 002.887.005 3.161 3.161 0 01-2.956 2.038z"
  }));
}
OST.DefaultColor = DefaultColor;
var OST_default = OST;
//# sourceMappingURL=OST.js.map
