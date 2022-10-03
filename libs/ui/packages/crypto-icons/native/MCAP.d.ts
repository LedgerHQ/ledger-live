/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MCAP({ size, color }: Props): JSX.Element;
declare namespace MCAP {
    var DefaultColor: string;
}
export default MCAP;
