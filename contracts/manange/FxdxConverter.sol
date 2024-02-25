// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../fxdx/IMintable.sol";
import "./IFxdxConverter.sol";

contract FxdxConverter is Ownable, IFxdxConverter {
    using SafeERC20 for IERC20;

    address public immutable fxdxV1;
    address public immutable fxdxV2;
    mapping (address => bool) public isHandler;

    event SetHandler(address account, bool isActive);
    event Converted(address from, uint256 amount, address receiver);

    constructor(address _fxdxV1, address _fxdxV2) {
        fxdxV1 = _fxdxV1;
        fxdxV2 = _fxdxV2;
    }

    modifier onlyHandler() {
        require(isHandler[msg.sender], "FxdxConverter: forbidden");
        _;
    }

    // to help users who accidentally send their tokens to this contract
    function withdrawToken(address _token, address _account, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(_account, _amount);
    }

    /**
     * @dev Set an {_account} as a handler or not, according to {_isActive} value.
     * A handler can convert FXDX (v1) into FXDX (v2) by spending the allowance.
     *
     * Emits a {SetHandler} event.
     */
    function setHandler(address _account, bool _isActive) external onlyOwner {
        isHandler[_account] = _isActive;
        emit SetHandler(_account, _isActive);
    }

    function convert(uint256 _amount) external override {
        _convert(msg.sender, _amount, msg.sender);
    }

    function convertTo(uint256 _amount, address _receiver) external override {
        _convert(msg.sender, _amount, _receiver);
    }

    function convertFrom(address _from, uint256 _amount, address _receiver) external override onlyHandler {
        _convert(_from, _amount, _receiver);
    }

    function _convert(address _from, uint256 _amount, address _receiver) internal {
        if (_from == msg.sender) {
            IMintable(fxdxV1).burn(_from, _amount);
        } else {
            IERC20(fxdxV1).safeTransferFrom(_from, address(this), _amount);
            IMintable(fxdxV1).burn(address(this), _amount);
        }

        IERC20(fxdxV2).safeTransfer(_receiver, _amount);
        emit Converted(_from, _amount, _receiver);
    }
}
