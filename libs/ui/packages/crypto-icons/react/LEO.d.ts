/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LEO({ size, color }: Props): JSX.Element;
declare namespace LEO {
    var DefaultColor: string;
}
export default LEO;
