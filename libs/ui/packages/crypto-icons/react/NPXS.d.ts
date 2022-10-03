/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NPXS({ size, color }: Props): JSX.Element;
declare namespace NPXS {
    var DefaultColor: string;
}
export default NPXS;
