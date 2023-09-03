import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ethers } from "ethers";

import { useOutletContext, useNavigate, useParams } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';

import { PlayFill, PauseFill } from 'react-bootstrap-icons';

import { BigNumber } from 'ethers';

const {
  REACT_APP_TRACKING_FUNCTION_URL,
  REACT_APP_DECRYPT_FUNCTION_URL
} = process.env;
const TRACKING_INTERVAL_MILLISECONDS = 10000; // 10 seconds

const PlayControls = ({songId, playing, subscriber, handleSongPlay}) => {
  if (playing) {
    return <PauseFill onClick={() => handleSongPlay(songId, subscriber)}></PauseFill>;
  }

  return <PlayFill onClick={() => handleSongPlay(songId, subscriber)}></PlayFill>;
};

const Song = ({
  song,
  playable,
  canBePurchased,
  purchased,
  exclusivePrice,
  subscriber,
  handleSongPlay,
  handleSongBuy
}) => {
  return <ListGroup.Item as='li' variant='dark' key={song.id} className='d-flex align-items-center justify-content-around' >
        {song.title}
        {
          playable &&
            <PlayControls songId={song.id} playing={song.playing} subscriber={subscriber} handleSongPlay={handleSongPlay} />
        }

    { purchased && <Badge bg="success">Owned</Badge> }
    { canBePurchased &&
        <Button onClick={() => handleSongBuy(song.id)}>Buy ({ exclusivePrice.toString() } JUST)</Button>
    }
      </ListGroup.Item>;
};

const ArtistSongsList = ({
  songs,
  account,
  accountIsArtist,
  subscriber,
  handleSongPlay,
  handleSongBuy,
  platform,
}) => {
  const [songItems, setSongItems] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Promise.all(songs.map(async (song) => {
      const exclusivePrice = await platform.exclusiveSongPrices(song.id);
      const isExclusive = exclusivePrice.gt(BigNumber.from(0));

      const songPurchased = await platform.isSongPurchased(account, song.id);
      const playable = (isExclusive && songPurchased) ||
        (subscriber && !isExclusive) ||
        accountIsArtist();

      const canBePurchased = !accountIsArtist() && isExclusive && !songPurchased;

      return <Song key={song.id} song={song} playable={playable} exclusivePrice={exclusivePrice}
        subscriber={subscriber} canBePurchased={canBePurchased} purchased={songPurchased} handleSongPlay={handleSongPlay}
        handleSongBuy={handleSongBuy} />;
    })).then(setSongItems);
  }, [setSongItems, accountIsArtist, handleSongPlay, handleSongBuy, platform, songs, subscriber]);

  return songItems.length > 0 ? <ListGroup variant='flush'>{songItems}</ListGroup> : null;
};

const ArtistSongs = () => {
  const { platform, justToken, account, accountSigner, subscriber, setMessage } = useOutletContext();
  const navigate = useNavigate();
  const { artistAddress } = useParams();

  const [songs, setSongs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [playbackEndedSongId, setPlaybackEndedSongId] = useState(null);

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

  // For both play and pause/stop events
  const handleSongPlay = useCallback((songId, subscriber) => {
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
      song.audio.play();
    }

    const otherSongs = songs.filter((sng) => sng.id !== songId);
    const newSongs = [ ...otherSongs, song ].sort((a, b) => a.order - b.order);
    setSongs(newSongs);
  }, [songs, setSongs, setTrackingInterval, trackingInterval, sendTrackingEvent]);

  const handleSongEnded = (songId) => {
    setPlaybackEndedSongId(songId);
  };

  useEffect(() => {
    if (playbackEndedSongId === null) return;

    handleSongPlay(playbackEndedSongId, subscriber);

    setPlaybackEndedSongId(null);
  }, [playbackEndedSongId, handleSongPlay, subscriber, setPlaybackEndedSongId]);

  const decryptPinnedFile = async (cid) => {
    return (await axios.get(await decryptedAudioURL(cid))).data;
  };

  const createSignature = async () => {
    const message = accountSigner.address.toLowerCase();
    const encodedAccount = ethers.utils.defaultAbiCoder.encode(['address'], [message]);
    const messageHash = ethers.utils.keccak256(encodedAccount);
    const signedData = ethers.utils.arrayify(messageHash);

    return await accountSigner.signMessage(signedData);
  };

  const decryptedAudioURL = async (cid) => {
    // TODO: add signature here to allow only owners or subscribers here and to make it harder for
    // someone to just pick owners address and decrypting the audio file
    // TODO: consider passing cid and account address in req. body instead for security reasons
    return `${REACT_APP_DECRYPT_FUNCTION_URL}?cid=${cid}&account=${account}`;
  };

  useEffect(() => {
    (async () => {
      const songsCount = await platform.getArtistSongsCount(artistAddress);
      let songsData = [];

      for(let i = 0; i < songsCount; i++) {
        const id = await platform.getArtistSongId(artistAddress, i);
        const uri = await platform.getSongUri(id);
        const metadata = await decryptPinnedFile(uri);

        const audio = new Audio(await decryptedAudioURL(metadata.cid));

        audio.addEventListener('ended', () => handleSongEnded(id.toString()));
        songsData.push({ order: i, id: id.toString(), uri, title: metadata.title, audio, playing: false });
      }

      setSongs(songsData);
    })();
  }, [platform, setSongs, artistAddress]);

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

  const accountIsArtist = () => {
    return account === artistAddress.toLowerCase();
  };

  return <>
    { accountIsArtist()  && <Button onClick={() => navigateToNewSong()}>Add a song</Button> }
    <ArtistSongsList
      songs={songs}
      account={account}
      accountIsArtist={accountIsArtist}
      subscriber={subscriber}
      handleSongPlay={handleSongPlay}
      handleSongBuy={handleSongBuy}
      platform={platform}
    />
  </>;
};

export default ArtistSongs;

