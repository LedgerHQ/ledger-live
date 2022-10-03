/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WAX({ size, color }: Props): JSX.Element;
declare namespace WAX {
    var DefaultColor: string;
}
export default WAX;
