/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BURST({ size, color }: Props): JSX.Element;
declare namespace BURST {
    var DefaultColor: string;
}
export default BURST;
