/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DAT({ size, color }: Props): JSX.Element;
declare namespace DAT {
    var DefaultColor: string;
}
export default DAT;
