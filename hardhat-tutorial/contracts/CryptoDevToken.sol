// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    uint256 public constant maxTotalSupply = 10000 * 10 ** 18;
    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant tokensPerNFT = 10 * 10 ** 18;

    mapping(uint256 => bool) public tokenIdsClaimed;

    ICryptoDevs CryptoDevs;

    constructor(address _cryptoDevsContract) ERC20("Crypto Devs Token", "CD") {
        CryptoDevs = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint256 amount) public payable {
        require(msg.value >= (amount * tokenPrice), "Ether sent is incorrect");

        uint256 amountWithDecimals = amount * 10 ** 18;

        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply available."
        );

        _mint(msg.sender, amountWithDecimals);
    }

    function claim() public {
        uint256 balance = CryptoDevs.balanceOf(msg.sender);
        require(balance > 0, "You have no Crypto Devs NFT");

        uint256 amount = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevs.tokenOfOwnerByIndex(msg.sender, i);
            if (!tokenIdsClaimed[tokenId]) {
                amount++;
                tokenIdsClaimed[tokenId] = true;
            }
        }

        require(amount > 0, "You have already claimed tokens for NFT");
        require(
            (totalSupply() + (amount * tokensPerNFT)) <= maxTotalSupply,
            "Exceeds the max total supply available."
        );

        _mint(msg.sender, amount * tokensPerNFT);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw, contract balance empty");

        address _owner = owner();
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send ETH");
    }

    receive() external payable {}

    fallback() external payable {}
}
