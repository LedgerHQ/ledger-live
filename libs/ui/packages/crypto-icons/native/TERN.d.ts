/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TERN({ size, color }: Props): JSX.Element;
declare namespace TERN {
    var DefaultColor: string;
}
export default TERN;
