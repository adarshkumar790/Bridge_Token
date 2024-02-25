// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

interface IFxdxConverter {
    function convert(uint256 _amount) external;
    function convertTo(uint256 _amount, address _receiver) external;
    function convertFrom(address _from, uint256 _amount, address _receiver) external;
}
