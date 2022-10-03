/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ICX({ size, color }: Props): JSX.Element;
declare namespace ICX {
    var DefaultColor: string;
}
export default ICX;
