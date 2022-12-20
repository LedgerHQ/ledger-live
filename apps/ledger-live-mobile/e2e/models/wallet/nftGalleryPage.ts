import { getElementById } from "../../helpers";

export default class NftGalleryPage {
  getNftList = () => getElementById(`wallet_nft_gallery_list`);
  getNftListItems = () => getElementById(`wallet_nft_gallery_list_item`);
}
