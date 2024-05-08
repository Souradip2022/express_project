const asyncHandler = (requestHandler) => async (req, res) => {
  try {
    await Promise.resolve(requestHandler(req, res));
  } catch (err) {
    res.status(err.code || 500).json({
      success: false,
      message: err.message
    });

    console.warn(err.message);
  }
};

export {asyncHandler};

