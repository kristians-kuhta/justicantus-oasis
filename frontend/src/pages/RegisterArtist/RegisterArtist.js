import React, { useState } from 'react';
import {
  Container,
  Form,
  Button,
  ProgressBar
} from 'react-bootstrap';

import { useForm } from 'react-hook-form';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ARTIST_RESOURCE_TYPE = 1;

const RegisterArtist = () => {
  const { account, platform, setMessage, setLoggedInArtist } = useOutletContext();
  const [progress, setProgress] = useState(0);
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

    if (creatorLowercase === accountLowercase && resourceType === ARTIST_RESOURCE_TYPE) {
      setProgress(100);
      setMessage({
        text: 'Artist registered!',
        type: 'success'
      });

      const artistName = await platform.getArtistName(account);

      setLoggedInArtist({
        id: assignedId,
        name: artistName
      });

      navigate(`/artists/${creator}/songs`);
    }
  }

  const onSubmit = async (data) => {
    setMessage({ text: '', type: null });

    setProgress(33);

    try {
      platform.on('ResourceRegistered', handleResourceRegisteredEvent);

      // TODO: consider narrowing this down even further
      await platform.registerArtist(data.artistName, { gasLimit: 200000 });

      setProgress(66);
    } catch (e) {
      setMessage({
        text: 'Could not register artist!',
        type: 'danger'
      });

      setProgress(0);
      console.error(e);
    }
  }
  const onError = error => console.error(error);

  return <>
    <Container className="my-4">
      <h1 className="mb-3">Register as an artist</h1>
      <Form onSubmit={handleSubmit(onSubmit, onError)}>
        <Form.Group className="mb-3">
          <Form.Label>Account address</Form.Label>
          <Form.Control
            type="text"
            disabled={true}
            value={account || ''}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formArtistName">
          <Form.Label>Artist name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Artist name"
            {...register("artistName", { required: "must enter name" })}
          />
          {errors.artistName && (
            <Form.Text className="text-danger">
              {errors.artistName.message}
            </Form.Text>
          )}
        </Form.Group>

        <Button variant="primary" type="submit" disabled={progress > 0 || !isDirty || !isValid} >
          Register
        </Button>
        { progress > 0 && progress < 100 && <ProgressBar className="mt-3" animated now={progress} /> }
      </Form>
    </Container>
  </>;
};

export default RegisterArtist;

