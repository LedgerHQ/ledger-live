/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ARDR({ size, color }: Props): JSX.Element;
declare namespace ARDR {
    var DefaultColor: string;
}
export default ARDR;
