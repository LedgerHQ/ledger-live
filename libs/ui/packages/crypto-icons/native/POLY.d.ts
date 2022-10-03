/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function POLY({ size, color }: Props): JSX.Element;
declare namespace POLY {
    var DefaultColor: string;
}
export default POLY;
