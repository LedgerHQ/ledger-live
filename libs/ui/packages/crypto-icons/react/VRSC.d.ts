/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VRSC({ size, color }: Props): JSX.Element;
declare namespace VRSC {
    var DefaultColor: string;
}
export default VRSC;
