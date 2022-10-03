/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HSR({ size, color }: Props): JSX.Element;
declare namespace HSR {
    var DefaultColor: string;
}
export default HSR;
