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
  default: () => COQUI_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#71C800";
function COQUI({
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
    d: "M19.365 11.036c-.59.028-1.183.063-1.773.042-.53-.02-1.057-.108-1.585-.17a.306.306 0 01-.148-.068c-.874-.716-1.732-1.45-2.485-2.297-.275-.31-.497-.645-.621-1.051-.168-.548-.87-.76-1.39-.442-.547.333-.64 1.108-.18 1.552.08.08.181.14.292.17.397.097.705.334.995.602.52.481.987 1.013 1.44 1.557.13.156.064.336-.135.358-.308.036-.617.068-.927.081-.584.024-1.168.047-1.752.041a6.412 6.412 0 01-.977-.108 1.269 1.269 0 01-.43-.17c-.434-.26-.884-.082-1.135.175a.996.996 0 00-.15 1.19c.208.358.619.566.988.488.106-.022.211-.07.306-.124.247-.141.516-.207.793-.224.446-.027.894-.053 1.34-.042.568.013 1.136.063 1.704.099.077.005.155.009.232.02.213.035.274.205.133.373-.17.2-.333.408-.516.596-.385.394-.776.783-1.174 1.165a1.39 1.39 0 01-.647.35c-.492.117-.735.592-.666 1.072a.993.993 0 00.977.836c.447 0 .79-.239.91-.666.122-.44.404-.771.698-1.094.726-.796 1.54-1.496 2.373-2.175a.353.353 0 01.168-.075c.421-.055.842-.123 1.264-.15.476-.03.954-.037 1.43-.02.498.021.993.086 1.503.134-.01.172-.012.32-.025.465-.092.945-.332 1.85-.777 2.69-1.098 2.074-2.792 3.373-5.083 3.879a7.144 7.144 0 01-1.562.154c-.559-.001-1.118.004-1.676-.002-1.55-.016-2.966-.457-4.227-1.36-1.517-1.088-2.497-2.548-2.919-4.37a6.665 6.665 0 01-.168-1.239 32.874 32.874 0 01-.02-2.367A7.373 7.373 0 019.2 4.01a7.2 7.2 0 011.873-.254c.648-.002 1.295-.012 1.943.003 1.55.036 2.957.509 4.202 1.434 1.489 1.107 2.436 2.574 2.835 4.387.097.435.13.884.196 1.348-.323.041-.603.096-.885.11z"
  }));
}
COQUI.DefaultColor = DefaultColor;
var COQUI_default = COQUI;
//# sourceMappingURL=COQUI.js.map
