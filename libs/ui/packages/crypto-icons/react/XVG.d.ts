/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XVG({ size, color }: Props): JSX.Element;
declare namespace XVG {
    var DefaultColor: string;
}
export default XVG;
