/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CHIPS({ size, color }: Props): JSX.Element;
declare namespace CHIPS {
    var DefaultColor: string;
}
export default CHIPS;
