/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CIX({ size, color }: Props): JSX.Element;
declare namespace CIX {
    var DefaultColor: string;
}
export default CIX;
