/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DBC({ size, color }: Props): JSX.Element;
declare namespace DBC {
    var DefaultColor: string;
}
export default DBC;
