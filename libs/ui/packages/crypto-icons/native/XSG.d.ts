/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XSG({ size, color }: Props): JSX.Element;
declare namespace XSG {
    var DefaultColor: string;
}
export default XSG;
