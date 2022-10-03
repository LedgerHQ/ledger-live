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
  default: () => RIC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#60E4DD";
function RIC({
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
    d: "M6.858 15.393c.225-.341.438-.66.639-.96H5.199a.07.07 0 01-.07-.07v-.477a.07.07 0 01.07-.07h2.716c1.453-2.121 2.18-2.995 2.18-3.084 0-.137-.03-.206-.526-.206-.978 0-2.587-.698-2.587-2.604 0-1.038 1.678-2.297 2.658-2.297.454 0 .524.193.315.205-.56.035-1.784 1.152-1.784 2.228 0 .72.64 1.954 2.063 1.954 1.681 0 3.117-2.673 6.609-2.673 2.098 0 2.657 1.64 2.657 2.09 0 .45-.655.686-1.538.686-.884 0-.917-1.577-2.693-1.577-2.788 0-5.163 3.02-6.303 5.278h1.968a.07.07 0 01.07.07v.477a.071.071 0 01-.02.05.072.072 0 01-.05.02H8.675a7.02 7.02 0 00-.345.96h1.973c.038 0 .07.03.07.07v.478a.07.07 0 01-.07.07H8.242c.037.874.77 1.662 2.202 2.364h-5.49c.493-.793.993-1.582 1.5-2.365H4.572a.07.07 0 01-.07-.07v-.477a.07.07 0 01.069-.07h2.288z"
  }));
}
RIC.DefaultColor = DefaultColor;
var RIC_default = RIC;
//# sourceMappingURL=RIC.js.map
