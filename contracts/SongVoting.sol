// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SharedStorage } from "./SharedStorage.sol";

contract SongVoting is Ownable, SharedStorage {
  // NOTE: Period being 0 means that voting is not active.
  //       This is the last timestamp that you can vote.
  uint256 public votingPeriodEnds;

  mapping(uint256 songId => uint256 votes) internal songVotes;
  mapping(address account => uint256 periodEnd) internal lastVotedPeriod;

  uint256[] internal songsWithVotes;
  uint256 internal songsWithVotesCount;
  address[] internal voters;
  uint256 internal votersCount;

  event VotingOpen();
  event VotingClosed(uint256 winningSongId);

  error VotingActive();
  error VotingNotActive();
  error VotingIsAlreadyOpen();
  error VotingHasNotEnded();
  error AlreadyVoted();

  error RewardsPerProposalZero();
  error TimestampMustBeInFuture();

  function openVotingPeriod(uint256 endTimestamp) external onlyOwner {
    _requireInactiveVotingPeriod();
    _requireTimestampInFuture(endTimestamp);

    votingPeriodEnds = endTimestamp;

    _resetVotingStorage();

    emit VotingOpen();
  }

  function vote(uint256 _songId) external {
    _requireSongExists(_songId);
    _requireActiveVotingPeriod();
    _requireHasNotVoted();

    if (songVotes[_songId] == 0) {
      _insertSongsWithVotes(_songId);
    }

    songVotes[_songId]++;
    lastVotedPeriod[msg.sender] = votingPeriodEnds;

    _insertVoter(msg.sender);
  }

  function closeVotingPeriod() external {
    _requireVotingPeriodEnded();

    votingPeriodEnds = 0;

    _distributeVotingRewards();
    uint256 winningSongId = _winningSongId();

    emit VotingClosed(winningSongId);
  }

  function isVotingPeriodActive() external view returns (bool) {
    return _isVotingPeriodActive();
  }

  // NOTE: we require account and signature, because only account should know if
  //       it has voted
  function hasVotedCurrentPeriod(address account, bytes calldata signature) external view returns (bool) {
    if (!_isVotingPeriodActive()) {
      return false;
    }

    bytes32 messageHash = keccak256(abi.encode(account));

    if (!_verifySignature(account, messageHash, signature)) {
      return false;
    }

    for(uint256 i=0; i < votersCount; i++) {
      if (voters[i] == account) {
        return true;
      }
    }

    return false;
  }

  function _insertSongsWithVotes(uint256 songId) internal {
    // Array needs to be expanded
    if (songsWithVotes.length == songsWithVotesCount) {
      songsWithVotes.push(songId);
    } else {
      songsWithVotes[songsWithVotesCount] = songId;
    }

    songsWithVotesCount++;
  }

  function _insertVoter(address voter) internal {
    // Array needs to be expanded
    if (voters.length == votersCount) {
      voters.push(voter);
    } else {
      voters[votersCount] = voter;
    }

    votersCount++;
  }

  function _distributeVotingRewards() internal {
    for(uint256 i=0; i < votersCount; i++) {
      address voter = voters[i];
      uint256 reward = _rewardTokensPerVoter();

      rewardsToken.mint(voter, reward);
    }
  }

  function _resetVotingStorage() internal {
    for(uint256 i=0; i < songsWithVotesCount; i++) {
      uint256 songId = songsWithVotes[i];
      songVotes[songId] = 0;
    }

    votersCount = 0;
    songsWithVotesCount = 0;
  }

  // TODO: consider if we need to figure out how to avoid
  //  storing both voters array and lastVotedPeriod mapping
  function _requireHasNotVoted() internal view {
    if (lastVotedPeriod[msg.sender] == votingPeriodEnds) {
      revert AlreadyVoted();
    }
  }

  // TODO: deal with the case of equal amount of votes for top songs
  function _winningSongId() internal view returns (uint256 songId) {
    uint256 maxVotes;

    for(uint256 i=0; i < songsWithVotesCount; i++) {
      uint256 currentSongId = songsWithVotes[i];
      uint256 votesForSong = songVotes[currentSongId];

      if (votesForSong > maxVotes) {
        maxVotes = votesForSong;
        songId = currentSongId;
      }
    }
  }

  function _requireTimestampInFuture(uint256 timestamp) internal view {
    if (timestamp <= block.timestamp) {
      revert TimestampMustBeInFuture();
    }
  }

  function _rewardTokensPerVoter() internal view returns (uint256) {
    // NOTE: this probably results in voters being paid out just a little under
    //       what they should be paid out, but the difference should be really small
    return rewardsPerProposal / votersCount;
  }

  function _requireVotingPeriodEnded() internal view {
    if (votingPeriodEnds == 0 || block.timestamp <= votingPeriodEnds) {
      revert VotingHasNotEnded();
    }
  }

  function _requireActiveVotingPeriod() internal view {
    if (!_isVotingPeriodActive()) {
      revert VotingNotActive();
    }
  }

  function _requireInactiveVotingPeriod() internal view {
    if (_isVotingPeriodActive()) {
      revert VotingActive();
    }
  }

  function _requireVotingRewards() internal view {
    if (rewardsPerProposal == 0) {
      revert RewardsPerProposalZero();
    }
  }

  function _isVotingPeriodActive() internal view returns (bool) {
    return votingPeriodEnds >= block.timestamp;
  }
}
