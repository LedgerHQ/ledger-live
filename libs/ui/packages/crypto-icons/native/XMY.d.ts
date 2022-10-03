/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XMY({ size, color }: Props): JSX.Element;
declare namespace XMY {
    var DefaultColor: string;
}
export default XMY;
