/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XCP({ size, color }: Props): JSX.Element;
declare namespace XCP {
    var DefaultColor: string;
}
export default XCP;
