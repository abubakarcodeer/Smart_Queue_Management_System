export const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = err.status || (err.name === 'ZodError' ? 400 : 500);
  res.status(status).json({
    message: err.message || 'Server error',
    issues: err.issues,
  });
};
