import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [artistsFound, setArtistsFound] = useState(null);
  const [loading, setLoading] = useState(false);
  const { platform } = useOutletContext();

  useEffect(() => {
    // NOTE: this currently does not have pagination
    //       once the artists count reaches something substantial, that might
    //       become an issue
    setLoading(true);
    platform.artistCount().then((artistCount) => {
      for(let i=0; i < artistCount; i++) {
        platform.artistAccounts(i).then((artistAccount) => {
          platform.getArtistName(artistAccount).then((artistName) => {
            setArtists((prev) => {
              const otherArtists = prev.filter(({ account }) => account !== artistAccount);
              const newArtist = { title: artistName, account: artistAccount };

              return [ ...otherArtists, newArtist ];
            });
          });
        });
      };
    });
    setLoading(false);
  }, [platform, setLoading]);

  const handleSearch = async (evt) => {
    evt.preventDefault();

    const artistName = evt.target.querySelector('#artistName').value;

    const filteredArtists = artists.filter((artist) => {
      return artist.title.toLowerCase().includes(artistName.toLowerCase());
    });

    setArtistsFound(filteredArtists);
  };

  if (loading) {
    return <div className='mx-auto mt-3'><p>Loading artists...</p></div>;
  }

  if (artists.length === 0) {
    return <div className='mx-auto mt-3'><p>No artists yet.</p><p>Stick around!</p></div>;
  }

  // NOTE: if search is performed we display the results, even when nothing is found
  const renderedArtists = artistsFound ? artistsFound : artists;

  // TODO: extract to separate components
  return <>
    <Form onSubmit={handleSearch}>
      <Form.Group className="mb-3" >
        <Form.Control
          type="text"
          placeholder="Artist name..."
          id="artistName"
        />
      </Form.Group>

      <Button variant="primary" type="submit" >
        Search
      </Button>
    </Form>
    <ListGroup variant='flush'>
      {
        renderedArtists.map((artist) => (
          <ListGroup.Item as='li' variant='dark' key={artist.account} className='d-flex align-items-center justify-content-around' >
            <Link to={`/artists/${artist.account}/songs`}>
              { artist.title }
            </Link>
          </ListGroup.Item>)
        )
      }
      { artistsFound && artistsFound.length === 0 && <p>Did not find matching artists! Try a different search phrase!</p> }

    </ListGroup>
  </>;
};

export default Artists;

