/*
 * One SUI is minimal to stake.
 */
export class OneSuiMinForStake extends Error {
  override name = "OneSuiMinForStake";
  constructor(message = "OneSuiMinForStake") {
    super(message);
  }
}

/*
 * One SUI is minimal for partial unstake.
 */
export class OneSuiMinForUnstake extends Error {
  override name = "OneSuiMinForUnstake";
  constructor(message = "OneSuiMinForUnstake") {
    super(message);
  }
}

/*
 * One SUI is minimal to be left when partial unstake.
 */
export class OneSuiMinForUnstakeToBeLeft extends Error {
  override name = "OneSuiMinForUnstakeToBeLeft";
  constructor(message = "OneSuiMinForUnstakeToBeLeft") {
    super(message);
  }
}

/*
 * At least 0.1 SUI to unstake
 */
export class SomeSuiForUnstake extends Error {
  override name = "SomeSuiForUnstake";
  constructor(message = "SomeSuiForUnstake") {
    super(message);
  }
}
