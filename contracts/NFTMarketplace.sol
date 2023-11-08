// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMarketplace is ERC721URIStorage {
    address payable owner;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    uint256 listPrice = 0.01 ether;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }
    mapping(uint256 => ListedToken) private idToListedToken;

    function updateListPrice(uint256 _listPrice) public {
        require(owner == msg.sender, "Only the contract owner can set a new listing price");
        listPrice = _listPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedForTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    function createToken(string memory tokenURI, uint256 price) public payable returns (uint) {
        require(msg.value == listPrice, "Send enough ether to list");
        require(price > 0, "Invalid price");

        _tokenIds.increment();
        uint256 currentTokenId = _tokenIds.current();
        _safeMint(msg.sender, currentTokenId);
        _setTokenURI(currentTokenId, tokenURI);
        createListedToken(currentTokenId, price);
        return currentTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)), // Marketplace owns it
            payable(msg.sender), // Creator of this item is the one who listed it
            price,
            true
        );

        _transfer(msg.sender, address(this), tokenId);
    }

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        for (uint256 i = 1; i <= nftCount; i++) {
            tokens[i - 1] = idToListedToken[i];
        }
        return tokens;
    }

    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        ListedToken[] memory items = new ListedToken[](totalItemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToListedToken[i].owner == msg.sender || idToListedToken[i].seller == msg.sender) {
                items[itemCount] = idToListedToken[i];
                itemCount++;
            }
        }
        assembly {
            mstore(items, itemCount)
        }
        return items;
    }

    function executeSale(uint256 tokenId) public payable {
        uint256 price = idToListedToken[tokenId].price;
        require(msg.value == price, "Insufficient ethers");

        address seller = idToListedToken[tokenId].seller;

        idToListedToken[tokenId].currentlyListed = false;
        idToListedToken[tokenId].seller = payable(msg.sender);

        _transfer(address(this), msg.sender, tokenId);

        payable(owner).transfer(listPrice);
        payable(seller).transfer(msg.value);
    }
}
