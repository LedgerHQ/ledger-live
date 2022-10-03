/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DTR({ size, color }: Props): JSX.Element;
declare namespace DTR {
    var DefaultColor: string;
}
export default DTR;
