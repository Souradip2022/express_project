const asyncHandler = (requestHandler) => async (req, res, next) => {
  try {
    await requestHandler(req, res, next);
    next();
  } catch (err) {
    res.status(err.code || 500).json({
      success: false,
      message: err.message
    });

    console.warn(err.message);
  }
};

export {asyncHandler};

