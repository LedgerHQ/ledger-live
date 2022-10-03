/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DEEZ({ size, color }: Props): JSX.Element;
declare namespace DEEZ {
    var DefaultColor: string;
}
export default DEEZ;
