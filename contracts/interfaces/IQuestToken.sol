// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestToken
 * @notice Interface for the QuestToken ERC20 contract
 */
interface IQuestToken {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function remainingSupply() external view returns (uint256);
    function totalMinted() external view returns (uint256);
    function minters(address account) external view returns (bool);
    function addMinter(address minter) external;
    function removeMinter(address minter) external;
    function pause() external;
    function unpause() external;
}
