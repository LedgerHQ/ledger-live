/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CRPT({ size, color }: Props): JSX.Element;
declare namespace CRPT {
    var DefaultColor: string;
}
export default CRPT;
