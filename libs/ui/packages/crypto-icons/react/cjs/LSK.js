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
  default: () => LSK_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0D4EA0";
function LSK({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M10.687 19.093c-.01.011-.032.021-.042.032H9.48c-.021 0-.032-.01-.042-.021l-3.431-3.876a.067.067 0 010-.062l4.273-7.377c.021-.03.073-.03.094 0l1.195 2.069c.01.01.01.031 0 .053l-2.89 4.983c-.01.02 0 .041.01.063l1.726 1.943a.08.08 0 00.042.02h2.038c.052 0 .073.053.041.084l-1.85 2.09zm1.267-14.186c.022-.043.074-.043.084 0l5.958 10.237c.01.022 0 .043-.01.063l-3.431 3.876a.079.079 0 01-.042.021h-2.787c-.052 0-.072-.052-.04-.083l1.86-2.11 1.747-1.965c.02-.021.02-.042.01-.062l-3.307-5.705-1.247-2.152c-.01-.01-.01-.031 0-.053l1.205-2.067z"
  }));
}
LSK.DefaultColor = DefaultColor;
var LSK_default = LSK;
//# sourceMappingURL=LSK.js.map
