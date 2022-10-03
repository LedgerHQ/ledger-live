/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PPT({ size, color }: Props): JSX.Element;
declare namespace PPT {
    var DefaultColor: string;
}
export default PPT;
