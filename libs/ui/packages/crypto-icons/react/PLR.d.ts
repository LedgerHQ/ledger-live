/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PLR({ size, color }: Props): JSX.Element;
declare namespace PLR {
    var DefaultColor: string;
}
export default PLR;
