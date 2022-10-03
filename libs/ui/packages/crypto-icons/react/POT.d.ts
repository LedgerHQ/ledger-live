/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function POT({ size, color }: Props): JSX.Element;
declare namespace POT {
    var DefaultColor: string;
}
export default POT;
