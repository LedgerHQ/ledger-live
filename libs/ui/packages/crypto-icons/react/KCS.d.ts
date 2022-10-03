/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function KCS({ size, color }: Props): JSX.Element;
declare namespace KCS {
    var DefaultColor: string;
}
export default KCS;
