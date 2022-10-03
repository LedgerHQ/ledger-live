/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MAID({ size, color }: Props): JSX.Element;
declare namespace MAID {
    var DefaultColor: string;
}
export default MAID;
