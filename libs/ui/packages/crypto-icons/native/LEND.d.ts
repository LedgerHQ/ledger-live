/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LEND({ size, color }: Props): JSX.Element;
declare namespace LEND {
    var DefaultColor: string;
}
export default LEND;
