import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function Marketplace() {
    const sampleData = [
        {
            "name": "NFT#1",
            "description": "First NFT",
            "website": "http://axieinfinity.io",
            "image": "./",
            "price": "0.03ETH",
            "currentlySelling": "True",
            "address": "0xe81Bf5A757CB4f7F82a2F23b1e59bE45c33c5b13",
        },
        {
            "name": "NFT#2",
            "description": "Second NFT",
            "website": "http://axieinfinity.io",
            "image": "https://www.google.com/url?sa=i&url=https%3A%2F%2Fnft-monkey.com%2F&psig=AOvVaw3bkq7vP5-RCQXn0eLbhVtH&ust=1698811835381000&source=images&cd=vfe&opi=89978449&ved=0CBMQjRxqFwoTCNix6bK1n4IDFQAAAAAdAAAAABAI",
            "price": "0.03ETH",
            "currentlySelling": "True",
            "address": "0xe81Bf5A757C4f7F82a2F23b1e59bE45c33c5b13",
        },
        {
            "name": "NFT#3",
            "description": "Third NFT",
            "website": "http://axieinfinity.io",
            "image": "https://www.google.com/imgres?imgurl=https%3A%2F%2Fnftcalendar.io%2Fstorage%2Fuploads%2F2021%2F12%2F22%2F_1_nft_community_1222202102121361c2897dafc8f.jpeg&tbnid=0UNjAxrheNrReM&vet=10CBkQxiAoCGoXChMI2LHpsrWfggMVAAAAAB0AAAAAEA8..i&imgrefurl=https%3A%2F%2Fnftcalendar.io%2Fevents%2F2022-01-01%2F&docid=El5uZ86BYfzSRM&w=1080&h=1080&itg=1&q=NFT&ved=0CBkQxiAoCGoXChMI2LHpsrWfggMVAAAAAB0AAAAAEA8",
            "price": "0.03ETH",
            "currentlySelling": "True",
            "address": "0xe81Bf5A757C4f7F82a2F23b1e59bE45c33c5b13",
        },
    ];
    const [data, updateData] = useState(sampleData);
    const [dataFetched, updateFetched] = useState(false);

    async function getAllNFTs() {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
        //create an NFT Token
        let transaction = await contract.getAllNFTs()

        //Fetch all the details of every NFT from the contract and display
        const items = await Promise.all(transaction.map(async i => {
            var tokenURI = await contract.tokenURI(i.tokenId);
            console.log("getting this tokenUri", tokenURI);
            tokenURI = GetIpfsUrlFromPinata(tokenURI);
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            return item;
        }))

        updateFetched(true);
        updateData(items);
    }

    if (!dataFetched)
        getAllNFTs();

    return (
        <div>
            <Navbar></Navbar>
            <div className="flex flex-col place-items-center mt-20">
                <div className="md:text-xl font-bold text-white">
                    Top NFTs
                </div>
                <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {data.map((value, index) => {
                        return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
            </div>
        </div>
    );

}