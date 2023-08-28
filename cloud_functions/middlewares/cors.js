function corsMiddleware(req, res, next) {
  res.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS);

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  } else if (req.method !== 'POST') {
    // Return a "method not allowed" error
    return res.status(405).end();
  }

  // If the request is allowed, continue to the next middleware or route handler
  next();
}

module.exports = corsMiddleware;
