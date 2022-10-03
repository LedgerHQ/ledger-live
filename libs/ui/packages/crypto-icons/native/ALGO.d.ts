/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ALGO({ size, color }: Props): JSX.Element;
declare namespace ALGO {
    var DefaultColor: string;
}
export default ALGO;
