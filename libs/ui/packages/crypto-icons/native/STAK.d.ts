/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function STAK({ size, color }: Props): JSX.Element;
declare namespace STAK {
    var DefaultColor: string;
}
export default STAK;
