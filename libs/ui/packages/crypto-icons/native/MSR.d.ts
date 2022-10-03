/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MSR({ size, color }: Props): JSX.Element;
declare namespace MSR {
    var DefaultColor: string;
}
export default MSR;
