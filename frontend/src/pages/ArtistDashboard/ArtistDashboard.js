import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import {
  Button,
  ProgressBar
} from 'react-bootstrap';
import * as ethers from 'ethers';

const { BigNumber, utils } = ethers;

const ArtistDashboard = () => {
  const { account, platform, justToken, setMessage } = useOutletContext();
  const { artistAddress } = useParams();

  const [playedMinutes, setPlayedMinutes] = useState(0);
  const [claimedMinutes, setClaimedMinutes] = useState(0);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [unclaimedAmount, setUnclaimedAmount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [justTokenBalance, setJustTokenBalance] = useState(BigNumber.from(0));
  const [amount, setAmount] = useState(1);

  const handleBuyTokens = async () => {
    setMessage({ text: '', type: null });
    setProgress(50);

    const pricePerToken = await platform.pricePerToken();
    const price = pricePerToken.mul(amount);

    try {
      await (await platform.buyTokens(amount, { value: price })).wait();

      setProgress(100);
      setMessage({
        text: 'Purchase successful!',
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      setMessage({
        text: 'Could not purchase tokens!',
        type: 'danger'
      });
    }

    setProgress(0);
  };

  const handleClaimRewards = async () => {
    setMessage({ text: '', type: null });
    setProgress(50);

    try {
      await (await platform.claimRewards()).wait();
      setProgress(100);
      setMessage({
        text: 'Rewards claimed!',
        type: 'success'
      });

      setMinuteStats();
    } catch (e) {
      console.error(e);
      setMessage({
        text: 'Could not claim rewards!',
        type: 'danger'
      });
    }
    setProgress(0);
  };

  const unclaimedMinutes = useCallback(() => {
    return playedMinutes - claimedMinutes;
  }, [playedMinutes, claimedMinutes]);

  const setMinuteStats = useCallback(() => {
    platform.artistPlayedMinutes(artistAddress).then(setPlayedMinutes);
    platform.artistClaimedMinutes(artistAddress).then(setClaimedMinutes);
    platform.rewardForPlayedMinute().then((reward) => {
      const claimedAmountWei = claimedMinutes * reward;
      const claimedAmountEth = utils.formatEther(claimedAmountWei);

      const unclaimedAmountWei = unclaimedMinutes() * reward;
      const unclaimedAmountEth = utils.formatEther(unclaimedAmountWei);

      setClaimedAmount(claimedAmountEth);
      setUnclaimedAmount(unclaimedAmountEth);
    });
  }, [platform, artistAddress, claimedMinutes, unclaimedMinutes]);

  useEffect(() => {
    setMinuteStats();
  }, [setMinuteStats]);

  useEffect(() => {
    justToken.balanceOf(account).then((balance) => {
      setJustTokenBalance(utils.formatEther(balance.toString()))
    });
  }, [justToken, setJustTokenBalance, account]);

  return <div className='mt-5 d-flex flex-column align-items-center'>
    <p>Total played minutes: {playedMinutes.toString()}</p>
    <p>Total claimed minutes: {claimedMinutes.toString()}</p>
    <p>Total claimed amount: {claimedAmount.toString()} ETH</p>
    <p>Owned tokens: {justTokenBalance.toString()} JUST</p>
    <div>
      <p>Unclaimed minutes: {unclaimedMinutes()}</p>
      { unclaimedMinutes() > 0 && <Button onClick={handleClaimRewards}>Claim rewards</Button> }
    </div>
    <p>Total unclaimed amount: {unclaimedAmount.toString()} ETH</p>
    <p className="d-flex">
      <input type="number" step="1" min="1" value={amount} className="form-control"
        onChange={(e) => setAmount(parseInt(e.target.value, 10))}
      />
      <Button onClick={handleBuyTokens}>Buy tokens</Button>
    </p>
    { progress > 0 && progress < 100 && <ProgressBar className="mt-3" animated now={progress} /> }
  </div>;
};

export default ArtistDashboard;
