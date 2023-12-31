import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import { useOutletContext, useNavigate, useParams } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';

import { PlayFill, PauseFill, AwardFill } from 'react-bootstrap-icons';

import { BigNumber } from 'ethers';

const {
  REACT_APP_TRACKING_FUNCTION_URL,
  REACT_APP_DECRYPT_FUNCTION_URL
} = process.env;
const TRACKING_INTERVAL_MILLISECONDS = 10000; // 10 seconds

const PlayControls = ({songId, playing, loading, subscriber, handleSongPlay}) => {
  if (playing && !loading) {
    return <PauseFill onClick={() => handleSongPlay(songId, subscriber)}></PauseFill>;
  } else if (loading) {
    const style = {
      '--bs-spinner-width': '1em',
      '--bs-spinner-height': '1em',
      '--bs-spinner-border-width': '0.15em'
    };
    return <Spinner style={style} />;
  } else {
    return <PlayFill onClick={() => handleSongPlay(songId, subscriber)}></PlayFill>;
  }
};

const Song = ({
  song,
  songProgress,
  playable,
  canBePurchased,
  purchased,
  exclusivePrice,
  subscriber,
  isVotingPeriodActive,
  hasVotedCurrentPeriod,
  isLastWinningSong,
  handleSongPlay,
  handleSongBuy,
  handleSongVoting,
}) => {
  return <ListGroup.Item as='li' variant='dark' key={song.id} className='d-flex align-items-center justify-content-between pe-5 px-5' >
    <div>
      { isLastWinningSong && <AwardFill style={{marginRight: '0.5rem'}} /> }
      {song.title}
    </div>
    <div className="d-flex align-items-center gap-2">
      {
        playable &&
          <PlayControls songId={song.id} playing={song.playing} loading={song.loading}
            subscriber={subscriber} handleSongPlay={handleSongPlay} />
      }
      <ProgressBar now={songProgress[song.id]} max={100} style={{ width: '10rem', '--bs-progress-height': '0.375rem', '--bs-progress-bar-bg': 'var(--bs-dark-text-emphasis)' }} />

      { purchased && <Badge bg="success">Owned</Badge> }
      { canBePurchased &&
          <Button onClick={() => handleSongBuy(song.id)}>Buy ({ exclusivePrice.toString() } JUST)</Button>
      }
      { isVotingPeriodActive && !hasVotedCurrentPeriod && <Button onClick={() => handleSongVoting(song.id)}>Vote</Button> }
    </div>
  </ListGroup.Item>;
};

const ArtistSongsList = ({
  songs,
  progress,
  songProgress,
  account,
  accountIsArtist,
  subscriber,
  handleSongPlay,
  handleSongBuy,
  handleSongVoting,
  platform,
}) => {
  const [songItems, setSongItems] = useState([]);
  const { isVotingPeriodActive, hasVotedCurrentPeriod, lastWinningSongId } = useOutletContext();

  useEffect(() => {
    Promise.all(songs.map(async (song) => {
      const exclusivePrice = await platform.exclusiveSongPrices(song.id);
      const isExclusive = exclusivePrice.gt(BigNumber.from(0));

      const songPurchased = await platform.isSongPurchased(account, song.id);
      const playable = (isExclusive && songPurchased) ||
        (subscriber && !isExclusive) ||
        accountIsArtist();

      const canBePurchased = !accountIsArtist() && isExclusive && !songPurchased;
      return <Song key={song.id} song={song} songProgress={songProgress} playable={playable} exclusivePrice={exclusivePrice}
        subscriber={subscriber} canBePurchased={canBePurchased} purchased={songPurchased} handleSongPlay={handleSongPlay}
        handleSongBuy={handleSongBuy} handleSongVoting={handleSongVoting} isVotingPeriodActive={isVotingPeriodActive}
        hasVotedCurrentPeriod={hasVotedCurrentPeriod}
        isLastWinningSong={lastWinningSongId === song.id} />;
    })).then(setSongItems);
  }, [
    setSongItems,
    accountIsArtist,
    isVotingPeriodActive,
    hasVotedCurrentPeriod,
    lastWinningSongId,
    handleSongPlay,
    handleSongBuy,
    handleSongVoting,
    platform,
    songs,
    subscriber,
    account,
    songProgress
  ]);

  if (songItems.length === 0) return null;

  return <div class="row mt-4">
    { progress > 0 && progress < 100 && <ProgressBar className="mt-3" animated now={progress} /> }
    <ListGroup variant='flush'>{songItems}</ListGroup>
  </div>;
};

const ArtistSongs = () => {
  const { platform, justToken, account, accountSigner, accountSignature, subscriber, setMessage } = useOutletContext();
  const navigate = useNavigate();
  const { artistAddress } = useParams();

  const [songs, setSongs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [playbackEndedSongId, setPlaybackEndedSongId] = useState(null);
  const [songProgress, setSongProgress] = useState({});

  const sendTrackingEvent = useCallback((song) => {
    const signature = localStorage.getItem('subscriberSignature');
    const progressSeconds = song.audio.currentTime;

    const trackingPayload = {
      songId: song.id,
      artistAddress,
      account: subscriber,
      duration: progressSeconds,
      signature
    };

    console.log(`Going to update played minutes`);
    console.log(trackingPayload);

    try {
      axios.post(REACT_APP_TRACKING_FUNCTION_URL, trackingPayload);
    } catch (e) {
      console.error(e);
    }
  }, [subscriber, artistAddress]);

  const handleSongProgressUpdate = (evt, songId) => {
    const { currentTime, duration } = evt.target;

    const progress = Math.round(currentTime * 100 / duration);

    setSongProgress((prev) => ({...prev, [songId]: progress }));
  };

  const decryptFileURL = useCallback(async (cid) => {
    // TODO: consider passing cid and account address in req. body instead for security reasons
    const address = await accountSigner.getAddress();
    return `${REACT_APP_DECRYPT_FUNCTION_URL}?cid=${cid}&account=${address}&signature=${accountSignature}`;
  }, [accountSigner, accountSignature]);

  const decryptPinnedFile = useCallback(async (cid) => {
    return (await axios.get(await decryptFileURL(cid))).data;
  }, [decryptFileURL]);

  // For both play and pause/stop events
  const handleSongPlay = useCallback(async (songId, subscriber) => {
    let song = songs.find((sng) => sng.id === songId);

    if (song.playing) {
      song.playing = false;
      song.audio.pause();

      if (subscriber) {
        // Sending the last event before pausing audio
        sendTrackingEvent(song);
        clearInterval(trackingInterval);
      }
    } else {
      if (subscriber) {
        // NOTE: we send one tracking event straight away and set
        //       up a tracking interval
        sendTrackingEvent(song);
        setTrackingInterval(
          setInterval(() => {
            sendTrackingEvent(song);
          }, TRACKING_INTERVAL_MILLISECONDS)
        );
      }

      song.playing = true;
      song.audio.src = await decryptFileURL(song.audioCID);
      song.loading = true;
      song.audio.play();
      song.audio.addEventListener('canplaythrough', (evt) => {
        song.loading = false;

        // TODO: find a better way of updating loading status
        const otherSongs = songs.filter((sng) => sng.id !== songId);
        const newSongs = [ ...otherSongs, song ].sort((a, b) => a.order - b.order);
        setSongs(newSongs);

        evt.target.removeEventListener('canplaythrough', () => {});
      });
      song.audio.addEventListener('timeupdate', (evt) => handleSongProgressUpdate(evt, songId));
    }

    const otherSongs = songs.filter((sng) => sng.id !== songId);
    const newSongs = [ ...otherSongs, song ].sort((a, b) => a.order - b.order);
    setSongs(newSongs);
  }, [songs, setSongs, setTrackingInterval, trackingInterval, sendTrackingEvent, decryptFileURL]);

  const handleSongEnded = (songId) => {
    setPlaybackEndedSongId(songId);
    setSongProgress((prev) => ({ ...prev, [songId]: 0}));
  };

  useEffect(() => {
    if (playbackEndedSongId === null) return;

    handleSongPlay(playbackEndedSongId, subscriber);

    setPlaybackEndedSongId(null);
  }, [playbackEndedSongId, handleSongPlay, subscriber, setPlaybackEndedSongId]);

  useEffect(() => {
    (async () => {
      const songsCount = await platform.getArtistSongsCount(artistAddress);
      let songsData = [];

      for(let i = 0; i < songsCount; i++) {
        const id = await platform.getArtistSongId(artistAddress, i);
        const uri = await platform.getSongUri(id);
        const metadata = await decryptPinnedFile(uri);

        const audio = new Audio();

        audio.addEventListener('ended', () => handleSongEnded(id.toString()));
        const audioCID = metadata.cid;
        songsData.push({
          order: i,
          id: id.toString(),
          uri, audioCID,
          title: metadata.title,
          audio,
          playing: false,
          loading: false,
        });
      }

      setSongs(songsData);
    })();
  }, [platform, setSongs, artistAddress, decryptPinnedFile]);

  const navigateToNewSong = () => {
    navigate(`/artists/${artistAddress}/songs/new`);
  };

  const handleSongBuy = async (songId) => {
    const price = await platform.exclusiveSongPrices(songId);
    const tokenBalance = await justToken.balanceOf(account);

    if (tokenBalance.lt(price)) {
      const missingTokens = price.sub(tokenBalance);
      setMessage({
        text: `You need to buy ${missingTokens} JUST tokens to purchase this song!`,
        type: 'danger'
      });
      return;
    }

    setProgress(25);

    try {
      await justToken.approve(platform.address, price);

      setProgress(50);

      const txReceipt = await platform.buySong(artistAddress, songId);

      setProgress(75);

      await txReceipt.wait();

      setProgress(100);

      setMessage({
        text: `Song purchased!`,
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      setMessage({
        text: `Could not purchase the song!`,
        type: 'danger'
      });
    }
  };

  const handleSongVoting = async (songId) => {
    try {
      const tx = await platform.vote(songId);
      setProgress(50);

      await tx.wait();
      setProgress(100);
      setMessage({
        text: `Vote registered!`,
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      setProgress(0);
      setMessage({
        text: `Could not vote for the song!`,
        type: 'danger'
      });
    }
  };

  const accountIsArtist = () => {
    return account === artistAddress.toLowerCase();
  };

  return <div class="container">
    { accountIsArtist() &&
      <div className="mt-5 d-flex justify-content-end">
        <Button onClick={() => navigateToNewSong()}>Add a song</Button>
      </div>
    }
    <ArtistSongsList
      songs={songs}
      progress={progress}
      songProgress={songProgress}
      account={account}
      accountIsArtist={accountIsArtist}
      subscriber={subscriber}
      handleSongPlay={handleSongPlay}
      handleSongBuy={handleSongBuy}
      handleSongVoting={handleSongVoting}
      platform={platform}
    />
  </div>;
};

export default ArtistSongs;

