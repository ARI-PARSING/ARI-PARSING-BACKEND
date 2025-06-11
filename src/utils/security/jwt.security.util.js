import jwt from "jsonwebtoken";

const JWT_TARGET_CODE = {
  generateToken: (payload, secretKey) => {
    const token = jwt.sign(payload, secretKey);
    return {
      token,
      type: "JWT",
    };
  },

  verifyToken: (token, secretKey) => {
    try {
      const payload = jwt.verify(token, secretKey); 
      return {
        valid: true,
        expired: false,
        payload,
      };
    } catch (e) {
      let message = "Token verification failed";
      if (e instanceof jwt.JsonWebTokenError) {
        message = e.message;
      }
      return {
        valid: false,
        expired: false,
        message: message,
      };
    }
  },
};

const tokenStrategies = {
  JWT_TARGET_CODE,
};

export default tokenStrategies;
