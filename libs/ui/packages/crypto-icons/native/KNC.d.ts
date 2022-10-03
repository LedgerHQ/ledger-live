/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function KNC({ size, color }: Props): JSX.Element;
declare namespace KNC {
    var DefaultColor: string;
}
export default KNC;
