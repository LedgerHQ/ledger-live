/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CMM({ size, color }: Props): JSX.Element;
declare namespace CMM {
    var DefaultColor: string;
}
export default CMM;
