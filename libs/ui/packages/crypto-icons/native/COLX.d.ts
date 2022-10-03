/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function COLX({ size, color }: Props): JSX.Element;
declare namespace COLX {
    var DefaultColor: string;
}
export default COLX;
