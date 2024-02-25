// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

interface IFxdxDistributor {
    function minVestingDuration() external view returns (uint256);
    function maxVestingDuration() external view returns (uint256);

    function vestingDurations(address _account) external view returns (uint256);
    function claimable(address _account) external view returns (uint256);
    function cumulativeClaimAmounts(address _account) external view returns (uint256);
    function claimedAmounts(address _account) external view returns (uint256);
    function getVestedAmount(address _account) external view returns (uint256);

    function createVesting(address _account, uint256 _amount, uint256 _vestingDuration) external;
    function cancelVesting(address _account) external;
    function setVestingDuration(address _account, uint256 _vestingDuration) external;
    function increaseVestingAmount(address _account, uint256 _amount) external;
    function decreaseVestingAmount(address _account, uint256 _amount) external;

    function claimForAccount(address _account, address _receiver) external returns (uint256);
}
