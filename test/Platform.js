const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployPlatform } = require('./utils');

describe("Platform", function () {
  describe("Deployment", function () {
    it("sets the owner", async function () {
      const { platform, owner } = await loadFixture(deployPlatform);

      expect(await platform.owner()).to.equal(owner.address);
    });
  });
});
