/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TGCH({ size, color }: Props): JSX.Element;
declare namespace TGCH {
    var DefaultColor: string;
}
export default TGCH;
