// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title QuestToken
 * @notice ERC20 token rewarded for completing quests
 * @dev Max supply: 1 billion tokens
 */
contract QuestToken is ERC20, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public totalMinted;
    
    // Authorized minters (QuestVault contract)
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor() ERC20("QuestCoin", "QUEST") Ownable(msg.sender) {
        // Mint 10% to owner for initial liquidity/marketing
        uint256 initialMint = MAX_SUPPLY / 10; // 100 million
        _mint(msg.sender, initialMint);
        totalMinted = initialMint;
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender], "QuestToken: not a minter");
        _;
    }
    
    /**
     * @notice Add a new minter (only QuestVault should be minter)
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "QuestToken: zero address");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    /**
     * @notice Remove a minter
     * @param _minter Address to remove
     */
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    /**
     * @notice Mint tokens to user (called by QuestVault)
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mint(address _to, uint256 _amount) external onlyMinter whenNotPaused {
        require(totalMinted + _amount <= MAX_SUPPLY, "QuestToken: max supply exceeded");
        totalMinted += _amount;
        _mint(_to, _amount);
    }
    
    /**
     * @notice Check remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
    
    /**
     * @notice Get circulating supply (total minted - burned)
     */
    function getCirculatingSupply() external view returns (uint256) {
        return totalMinted;
    }
    
    /**
     * @notice Pause token minting (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause token minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw any stuck tokens
     * @param _token Token address (address(0) for ETH)
     */
    function emergencyWithdraw(address _token) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            IERC20(_token).transfer(owner(), IERC20(_token).balanceOf(address(this)));
        }
    }
    
    receive() external payable {}
}
