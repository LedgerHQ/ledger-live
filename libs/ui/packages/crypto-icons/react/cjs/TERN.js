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
  default: () => TERN_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F4C257";
function TERN({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M6.303 16.324l-.872-.506V8.183l1.404-.816.872.506-1.404.817v2.653l3.55 2.064v.982l-3.55-2.063v3.997zm12.266-1.519v1.013L12 19.635l-1.404-.817v-1.012l1.404.816 2.284-1.327V13.17l.845-.492v4.128l3.44-2zM20.244 12v-.172l-3.39 1.97v-.982l3.39-1.97V7.21l-8.245-4.79-4.121 2.395-.149.086 3.39 1.97-.844.491-3.39-1.97L3.756 7.21v9.58l4.122 2.396.149.086v-3.94l.844.49v3.941l3.13 1.818 8.243-4.79V12zm-4.272-1.818l-3.412 1.985v4.126l-.56.325-.422-.245v-3.968l-3.551-2.064v-.65l.422-.245 3.414 1.983 3.551-2.062.56.325v.49h-.002zm-4.843-5.31l.87-.505 6.57 3.817v1.631l-.87.506V8.689l-2.286-1.327-3.55 2.063-.846-.49 3.551-2.064-3.44-1.999z"
  }));
}
TERN.DefaultColor = DefaultColor;
var TERN_default = TERN;
//# sourceMappingURL=TERN.js.map
