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
  default: () => HPB_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#1591CA";
function HPB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12.436 11.454s.995-2.213-.956-4.35c0 0-1.11-1.425-3.405-1.313l.458-.18c.077-.03.157-.05.238-.061l.451-.059 3.176-.487s1.123-.22 1.974.022c.242.07.463.201.637.38.47.475 1.413 1.733.795 3.723 0 0-.612 2.212-2.908 2.737 0 0-.575.15-.46-.412zm-.142 1.233s1.435 1.967 4.307 1.413c0 0 1.816-.21 2.888-2.203l-.076.48a.97.97 0 01-.068.231l-.178.41-1.191 2.925s-.38 1.059-1.026 1.653c-.186.169-.412.287-.657.344-.657.152-2.241.306-3.674-1.229 0 0-1.63-1.644-.92-3.847 0-.002.16-.56.595-.177zm-1.038-.71s-2.453.258-3.372 2.98c0 0-.708 1.654.536 3.548l-.388-.3a.972.972 0 01-.172-.171l-.278-.354-2.013-2.455s-.755-.845-.963-1.688a1.4 1.4 0 01.017-.733c.186-.635.829-2.063 2.897-2.53 0 0 2.263-.582 3.871 1.108.002 0 .42.412-.135.595z"
  }), /* @__PURE__ */ React.createElement("path", {
    opacity: 0.5,
    d: "M12.836 12.12s2.445-.319 3.293-3.065c0 0 .665-1.67-.628-3.533l.396.29c.066.05.126.105.177.168l.286.346 2.078 2.405s.775.825 1.006 1.663c.065.24.065.492 0 .732-.17.64-.775 2.084-2.831 2.601 0 0-2.247.638-3.899-1.01.002 0-.427-.401.122-.598zm-1.228.452s-1.05 2.187.845 4.372c0 0 1.072 1.451 3.372 1.395l-.464.169a1.013 1.013 0 01-.24.054l-.452.048-3.187.41s-1.127.193-1.972-.071a1.464 1.464 0 01-.628-.396c-.458-.487-1.367-1.767-.7-3.74 0 0 .668-2.197 2.977-2.665 0 .002.58-.135.449.424zm.082-1.153s-1.464-1.947-4.327-1.35c0 0-1.813.234-2.856 2.243l.069-.48a.977.977 0 01.065-.233l.172-.413 1.148-2.943s.363-1.063 1.002-1.666c.184-.172.409-.293.654-.352.654-.163 2.236-.338 3.69 1.177 0 0 1.653 1.62.976 3.834 0-.002-.153.56-.593.183z"
  }));
}
HPB.DefaultColor = DefaultColor;
var HPB_default = HPB;
//# sourceMappingURL=HPB.js.map
