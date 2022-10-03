/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MOAC({ size, color }: Props): JSX.Element;
declare namespace MOAC {
    var DefaultColor: string;
}
export default MOAC;
