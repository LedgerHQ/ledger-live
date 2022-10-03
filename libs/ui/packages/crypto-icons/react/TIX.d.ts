/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TIX({ size, color }: Props): JSX.Element;
declare namespace TIX {
    var DefaultColor: string;
}
export default TIX;
