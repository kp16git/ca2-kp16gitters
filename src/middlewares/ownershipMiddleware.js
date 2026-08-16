export const verifyOwnership = (req, res, next) => {
  if (req.user.username !== req.params.username) {
    return res.status(403).json({ error: 'You can only access your own data' });
  }
  next();
};

export const verifyBodyOwnership = (req, res, next) => {
  if (req.user.username !== req.body.username) {
    return res.status(403).json({ error: 'You can only access your own data' });
  }
  next();
};