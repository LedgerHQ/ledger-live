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
  default: () => OAX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#164B79";
function OAX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M10.568 14l-.467.998H9.064L11.88 9l1.877 4h-1.061l-.84-1.737-.841 1.766-.446.972zm4.09.976l2.198-2.963-2.213-2.985h1.211l1.606 2.183-.585.802.585.803-1.605 2.182h-2.223l-.469-.997H14.2l.459.975zM18.053 12l-.593-.816 1.605-2.182h1.185L18.053 12zm0 0l2.197 2.998h-1.184l-1.605-2.182.592-.816zM8.567 9.869a2.974 2.974 0 01.814 2.132c.01.789-.281 1.551-.814 2.132-.542.607-1.211.867-2.001.867a2.681 2.681 0 01-2.001-.867A3 3 0 013.75 12a2.974 2.974 0 01.519-1.736l.69.735a2.116 2.116 0 00.271 2.449 1.797 1.797 0 001.335.607c.504 0 .986-.22 1.335-.607a1.987 1.987 0 00.542-1.421 2.115 2.115 0 00-.543-1.422 1.75 1.75 0 00-1.335-.578 1.642 1.642 0 00-.936.263l-.69-.735a2.562 2.562 0 011.63-.552 2.632 2.632 0 011.998.865h.001z"
  }));
}
OAX.DefaultColor = DefaultColor;
var OAX_default = OAX;
//# sourceMappingURL=OAX.js.map
