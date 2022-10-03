/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function KIN({ size, color }: Props): JSX.Element;
declare namespace KIN {
    var DefaultColor: string;
}
export default KIN;
