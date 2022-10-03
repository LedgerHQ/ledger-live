/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TOMO({ size, color }: Props): JSX.Element;
declare namespace TOMO {
    var DefaultColor: string;
}
export default TOMO;
