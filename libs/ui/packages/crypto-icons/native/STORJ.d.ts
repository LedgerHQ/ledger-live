/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function STORJ({ size, color }: Props): JSX.Element;
declare namespace STORJ {
    var DefaultColor: string;
}
export default STORJ;
