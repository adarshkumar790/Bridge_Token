// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./IFxdxDistributor.sol";

contract FxdxDistributor is Ownable, ReentrancyGuard, IFxdxDistributor {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public override minVestingDuration;
    uint256 public override maxVestingDuration;

    address public immutable fxdx;

    mapping (address => uint256) public override vestingDurations;
    mapping (address => uint256) public vestingAmounts;
    mapping (address => uint256) public override cumulativeClaimAmounts;
    mapping (address => uint256) public override claimedAmounts;
    mapping (address => uint256) public lastVestingTimes;

    mapping (address => bool) public isController;
    mapping (address => bool) public isClaimHandler;

    event SetController(address account, bool isActive);
    event SetClaimHandler(address account, bool isActive);
    event SetVestingDurationBounds(uint256 minVestingDuration, uint256 maxVestingDuration);
    event Claim(address receiver, uint256 amount);
    event CancelVesting(address account, uint256 claimedAmount, uint256 canceledAmount);
    event UpdateVestingAmount(address account, uint256 amount, bool isIncreased);
    event SetVestingDuration(address account, uint256 vestingDuration);

    constructor (
        address _fxdx,
        uint256 _minVestingDuration,
        uint256 _maxVestingDuration
    ) {
        fxdx = _fxdx;
        minVestingDuration = _minVestingDuration;
        maxVestingDuration = _maxVestingDuration;
    }

    modifier onlyController() {
        require(isController[msg.sender], "FxdxDistributor: forbidden");
        _;
    }

    modifier onlyClaimHandler() {
        require(isClaimHandler[msg.sender], "FxdxDistributor: forbidden");
        _;
    }

    // to help users who accidentally send their tokens to this contract
    function withdrawToken(address _token, address _account, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(_account, _amount);
    }

    /**
     * @dev Set an {_account} as a controller or not, according to {_isActive} value.
     * A controller can create, cancel and update vesting for accounts,
     *
     * Emits a {SetController} event.
     */
    function setController(address _account, bool _isActive) external onlyOwner {
        isController[_account] = _isActive;
        emit SetController(_account, _isActive);
    }

    /**
     * @dev Set an {_account} as a claim handler or not, according to {_isActive} value.
     * A claim handler can claim Fxdx token on behalf of other accounts
     *
     * Emits a {SetClaimHandler} event.
     */
    function setClaimHandler(address _handler, bool _isActive) external onlyOwner {
        isClaimHandler[_handler] = _isActive;
        emit SetClaimHandler(_handler, _isActive);
    }

    /**
     * @dev Set minVestingDuration and maxVestingDuration values.
     * These values set lower and upper limit for user vesting duartions.
     *
     * Emits a {SetVestingDurationBounds} event.
     */
    function setVestingDurationBounds(uint256 _minVestingDuration, uint256 _maxVestingDuration) external onlyOwner {
        require(_minVestingDuration <= _maxVestingDuration, "FxdxDistributor: invalid vestingDuration bounds");

        minVestingDuration = _minVestingDuration;
        maxVestingDuration = _maxVestingDuration;

        emit SetVestingDurationBounds(_minVestingDuration, _maxVestingDuration);
    }

    /**
     * @dev Create a vesting action for an {_account}. vesting amount and duration are set to {_amount} and {_vestingDuration}.
     * When a vesting action exists for the {_account}, {_amount} is added to the {_account} vesting amount.
     *
     * Emits {UpdateVestingAmount} and {SetVestingDuration} events.
     */
    function createVesting(address _account, uint256 _amount, uint256 _vestingDuration) external override onlyController nonReentrant {
        _updateVestingAmount(_account, _amount, true);
        _setVestingDuration(_account, _vestingDuration);
    }

    /**
     * @dev Cancel the vesting action for an {_account} and send claimed FXDX to the {_account}.
     *
     * Emits {Claim} and {CancelVesting} events.
     */
    function cancelVesting(address _account) external override onlyController nonReentrant {
        _claim(_account, _account);

        uint256 claimedAmount = cumulativeClaimAmounts[_account];
        uint256 vestingAmount = vestingAmounts[_account];
        uint256 totalVested = vestingAmount.add(claimedAmount);
        require(totalVested > 0, "FxdxDistributor: vested amount is zero");

        delete cumulativeClaimAmounts[_account];
        delete claimedAmounts[_account];
        delete lastVestingTimes[_account];
        delete vestingAmounts[_account];

        emit CancelVesting(_account, claimedAmount, vestingAmount);
    }

    /**
     * @dev Set vesting duration for an {_account} to {_vestingDuration}
     *
     * Emits a {SetVestingDuration} event.
     */
    function setVestingDuration(address _account, uint256 _vestingDuration) external override onlyController nonReentrant {
        _setVestingDuration(_account, _vestingDuration);
    }

    /**
     * @dev Increase the vesting amount of an {_account} by {_amount}.
     *
     * Emits an {UpdateVestingAmount} event.
     */
    function increaseVestingAmount(address _account, uint256 _amount) external override onlyController nonReentrant {
        _updateVestingAmount(_account, _amount, true);
    }

    /**
     * @dev Decrease the vesting amount of an {_account} by {_amount}.
     * When the vesting amount is less than {_amount}, it is set to 0.
     *
     * Emits an {UpdateVestingAmount} event.
     */
    function decreaseVestingAmount(address _account, uint256 _amount) external override onlyController nonReentrant {
        _updateVestingAmount(_account, _amount, false);
    }

    /**
     * @dev Claim FXDX tokens rewarded by the vesting action.
     *
     * Returns the claimed FXDX token amount.
     *
     * Emits a {Transfer} event.
     */
    function claim() external nonReentrant returns (uint256) {
        return _claim(msg.sender, msg.sender);
    }

    /**
     * @dev Claim FXDX tokens rewarded by the vesting action for {_account}.
     * The claimed FXDX tokens are transferred to {_receiver}.
     *
     * Returns the claimed FXDX token amount.
     *
     * Emits a {Transfer} event.
     */
    function claimForAccount(address _account, address _receiver) external override onlyClaimHandler nonReentrant returns (uint256) {
        return _claim(_account, _receiver);
    }

    /**
     * @dev Returns the claimable FXDX token amount.
     */
    function claimable(address _account) public override view returns (uint256) {
        uint256 amount = cumulativeClaimAmounts[_account].sub(claimedAmounts[_account]);
        uint256 nextClaimable = _getNextClaimableAmount(_account);
        return amount.add(nextClaimable);
    }

    /**
     * @dev Returns the total vested amount.
     */
    function getVestedAmount(address _account) public override view returns (uint256) {
        return vestingAmounts[_account].add(cumulativeClaimAmounts[_account]);
    }

    function _updateVestingAmount(address _account, uint256 _amount, bool _isIncrease) private {
        require(_amount > 0, "FxdxDistributor: invalid _amount");

        _updateVesting(_account);

        if (_isIncrease) {
            vestingAmounts[_account] += _amount;
        } else {
            if (vestingAmounts[_account] <= _amount) {
                vestingAmounts[_account] = 0;
            } else {
                vestingAmounts[_account] -= _amount;
            }
        }

        emit UpdateVestingAmount(_account, _amount, _isIncrease);
    }

    function _setVestingDuration(address _account, uint256 _vestingDuration) private {
        if (minVestingDuration > 0) {
            require(_vestingDuration >= minVestingDuration, "FxdxDistributor: invalid _vestingDuration");
        }

        if (maxVestingDuration > 0) {
            require(_vestingDuration <= maxVestingDuration, "FxdxDistributor: invalid _vestingDuration");
        }

        _updateVesting(_account);
        vestingDurations[_account] = _vestingDuration;

        emit SetVestingDuration(_account, _vestingDuration);
    }

    function _updateVesting(address _account) private {
        uint256 amount = _getNextClaimableAmount(_account);
        lastVestingTimes[_account] = block.timestamp;

        if (amount == 0) {
            return;
        }

        vestingAmounts[_account] -= amount;
        cumulativeClaimAmounts[_account] += amount;
    }

    function _getNextClaimableAmount(address _account) private view returns (uint256) {
        uint256 timeDiff = block.timestamp.sub(lastVestingTimes[_account]);

        uint256 vestingAmount = vestingAmounts[_account];
        uint256 vestingDuration = vestingDurations[_account];
        if (vestingAmount == 0 || vestingDuration == 0) { return 0; }

        uint256 vestedAmount = getVestedAmount(_account);
        uint256 claimableAmount = vestedAmount.mul(timeDiff).div(vestingDuration);

        if (claimableAmount < vestingAmount) {
            return claimableAmount;
        }

        return vestingAmount;
    }

    function _claim(address _account, address _receiver) private returns (uint256) {
        _updateVesting(_account);
        uint256 amount = claimable(_account);
        claimedAmounts[_account] = claimedAmounts[_account].add(amount);
        IERC20(fxdx).safeTransfer(_receiver, amount);
        emit Claim(_account, amount);
        return amount;
    }
}
