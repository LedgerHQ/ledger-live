/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function REN({ size, color }: Props): JSX.Element;
declare namespace REN {
    var DefaultColor: string;
}
export default REN;
