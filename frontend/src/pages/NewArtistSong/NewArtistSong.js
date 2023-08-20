import React, { useState } from 'react';
import {
  Container,
  Form,
  Button,
  ProgressBar,
  Row,
  Col,
} from 'react-bootstrap';

import { useForm } from 'react-hook-form';
import { useOutletContext, useNavigate } from 'react-router-dom';

import axios from 'axios';

const SONG_RESOURCE_TYPE = 2;
const SUPPORTED_AUDIO_FORMATS = [
  'audio/mp3',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/mpeg',
];

const isAudioFile = (value) => {
  if (!value) return;

  const fileType = value[0].type;

  if (!SUPPORTED_AUDIO_FORMATS.includes(fileType)) {
    return 'Unsupported audio format';
  }
}

const NewArtistSong = () => {
  const { account, platform, setMessage } = useOutletContext();
  const [progress, setProgress] = useState(0);
  const [exclusivePriceRequired, setExclusivePriceRequired] = useState(false);
  const [exclusivePriceEth, setExclusivePriceEth] = useState(0);
  const [currentEthPrice, setCurrentEthPrice] = useState(0);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isDirty, isValid, errors }
  } = useForm({
    mode: "onChange"
  });

  const handleResourceRegisteredEvent = async (creator, resourceType, assignedId) => {
    const accountLowercase = account.toLowerCase();
    const creatorLowercase = creator.toLowerCase();

    if (creatorLowercase === accountLowercase && resourceType === SONG_RESOURCE_TYPE) {
      setProgress(100);
      setMessage({
        text: 'Song registered!',
        type: 'success'
      });

      navigate(`/artists/${creator}/songs`);
    }
  }

  const pinFileToIpfs = async (title, file) => {
    const { REACT_APP_PIN_FUNCTION_URL } = process.env;

    const formData = new FormData();
    formData.set('title', title);
    formData.set('file', file);

    const response = await axios.post(REACT_APP_PIN_FUNCTION_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.Hash;
  };

  const uploadSongToIpfs = async (title, file) => {
    try {
      const songIpfsHash = await pinFileToIpfs(title, file);
      setProgress(50);
      return songIpfsHash;
    } catch (e) {
      console.error(e);
      setMessage({
        text: 'Song registration failed! Could not upload to IPFS',
        type: 'danger'
      });
    }
  };

  const handleExclusiveChange = ({target}) => {
    setExclusivePriceRequired(target.checked);
  };

  const handleExclusivePriceChange = (evt) => {
    const price = evt.target.value;
    setExclusivePriceEth(price);

    if (currentEthPrice) return;

    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum').
      then((res) => res.json()).
      then((data) => setCurrentEthPrice(data[0].current_price));
  };

  const exclusivePriceUsd = () => {
    return currentEthPrice ? (currentEthPrice * exclusivePriceEth).toFixed(2): 0;
  }

  const onSubmit = async (data) => {
    const { songFile, songTitle, songExclusive, songExclusivePrice } = data;

    try {
      platform.on('ResourceRegistered', handleResourceRegisteredEvent);

      setProgress(25);
      const ipfsHash = await uploadSongToIpfs(songTitle, songFile[0]);

      // TODO: figure out the actual gas needed here
      const exclusivePrice = songExclusive ? songExclusivePrice : 0;
      await platform.registerSong(ipfsHash, exclusivePrice, { gasLimit: 225000 });

      setProgress(75);
    } catch (e) {
      setMessage({
        text: 'Could not register the song!',
        type: 'danger'
      });

      setProgress(0);
      console.error(e);
    }
  }
  const onError = error => console.error(error);

  return <>
    <Container className="my-4">
      <h1 className="mb-3">Register a song</h1>
      <Form
        onSubmit={handleSubmit(onSubmit, onError)}
        encType="multipart/form-data"
      >
        <Form.Group className="mb-3" controlId="formSongTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            {...register("songTitle", { required: "must enter song title" })}
          />
          {errors.songTitle && (
            <Form.Text className="text-danger">
              {errors.songTitle.message}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="formSongFile">
          <Form.Label>Audio file</Form.Label>
          <Form.Control
            type="file"
            accept="audio/*"
            {...register("songFile", { required: "must upload song audio file",
              validate: isAudioFile })}
          />
          {errors.songFile && (
            <Form.Text className="text-danger">
              {errors.songFile.message}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="formSongExclusive">
          <Form.Check inline id="exclusiveCheckbox" className="pl-5">
            <Form.Check.Input onInput={handleExclusiveChange} {...register("songExclusive")} />
            <Form.Check.Label>Exclusive song</Form.Check.Label>
          </Form.Check>
        </Form.Group>

        { exclusivePriceRequired &&
          <Form.Group className="mb-3" controlId="formSongExclusivePrice">
            <Form.Label>Price (ETH)</Form.Label>
            <Row>
              <Col>
                <Form.Control
                  type="number"
                  step="0.001"
                  min="0.001"
                  onInput={handleExclusivePriceChange}
                  {...register("songExclusivePrice", {
                    required: "exclusive song must have price in ETH",
                    min: {
                      value: '0.001',
                      message: 'price must be at least 0.001 ETH'
                    }
                  })}
                />
                {errors.songExclusivePrice && (
                  <Form.Text className="text-danger">
                    {errors.songExclusivePrice.message}
                  </Form.Text>
                )}
              </Col>
              <Col className="mt-auto mb-auto text-muted">
                approx. { exclusivePriceUsd() } USD
              </Col>
            </Row>
          </Form.Group>
        }

        <Button variant="primary" type="submit" disabled={progress > 0 || !isDirty || !isValid} >
          Register
        </Button>
        { progress > 0 && progress < 100 && <ProgressBar className="mt-3" animated now={progress} /> }
      </Form>
    </Container>
  </>;
};

export default NewArtistSong;
