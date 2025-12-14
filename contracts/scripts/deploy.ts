import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const PoWRegistry = await ethers.getContractFactory("PoWRegistry");
  const powRegistry = await PoWRegistry.deploy();

  await powRegistry.waitForDeployment();

  const address = await powRegistry.getAddress();
  console.log("PoWRegistry deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

