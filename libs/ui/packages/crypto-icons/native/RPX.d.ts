/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RPX({ size, color }: Props): JSX.Element;
declare namespace RPX {
    var DefaultColor: string;
}
export default RPX;
