/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FLDC({ size, color }: Props): JSX.Element;
declare namespace FLDC {
    var DefaultColor: string;
}
export default FLDC;
