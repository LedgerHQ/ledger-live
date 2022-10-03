/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XMG({ size, color }: Props): JSX.Element;
declare namespace XMG {
    var DefaultColor: string;
}
export default XMG;
