const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", err);
  return res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
};

export { errorHandler };
