export const chainspecToml = (nativeMintLimit = "100_000_000"): string => `
[protocol]
version = '2.2.2'

[core]
pricing_handling = { type = 'payment_limited' }
fee_handling = { type = 'burn' }
refund_handling = { type = 'refund', refund_ratio = [75, 100] }

[transactions]
native_mint_lane    = [0, 2048,   1024, ${nativeMintLimit},       325]
native_auction_lane = [1, 3096,   2048, 2_500_000_000,     325]
install_upgrade_lane= [2, 750000, 2048, 1_000_000_000_000, 1]
native_transfer_minimum_motes = 2_500_000_000

[system_costs.auction_costs]
delegate   = 2_500_000_000
undelegate = 2_500_000_000
`;
