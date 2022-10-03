/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function KLOWN({ size, color }: Props): JSX.Element;
declare namespace KLOWN {
    var DefaultColor: string;
}
export default KLOWN;
