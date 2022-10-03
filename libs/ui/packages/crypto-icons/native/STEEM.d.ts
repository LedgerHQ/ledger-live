/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function STEEM({ size, color }: Props): JSX.Element;
declare namespace STEEM {
    var DefaultColor: string;
}
export default STEEM;
