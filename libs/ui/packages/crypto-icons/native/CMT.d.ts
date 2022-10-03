/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CMT({ size, color }: Props): JSX.Element;
declare namespace CMT {
    var DefaultColor: string;
}
export default CMT;
