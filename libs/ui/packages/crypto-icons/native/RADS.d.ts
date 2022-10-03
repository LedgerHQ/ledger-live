/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RADS({ size, color }: Props): JSX.Element;
declare namespace RADS {
    var DefaultColor: string;
}
export default RADS;
