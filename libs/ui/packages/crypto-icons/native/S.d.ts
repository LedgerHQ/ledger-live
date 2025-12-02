/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function S({ size, color }: Props): JSX.Element;
declare namespace S {
    var DefaultColor: string;
}
export default S;
