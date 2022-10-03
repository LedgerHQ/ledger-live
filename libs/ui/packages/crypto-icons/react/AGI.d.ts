/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AGI({ size, color }: Props): JSX.Element;
declare namespace AGI {
    var DefaultColor: string;
}
export default AGI;
