/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BAND({ size, color }: Props): JSX.Element;
declare namespace BAND {
    var DefaultColor: string;
}
export default BAND;
