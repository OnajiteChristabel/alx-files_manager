import { ObjectID } from 'mongodb';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Import your User model and Redis client her//
Define the AuthController object
const AuthController = {
  // Endpoint for user sign-in and token generation
  connect: async (req, res) => {
    try {
      // Extract Basic Auth credentials from the Authorization header
      const authHeader = req.headers.authorization || '';
      const [authType, authBase64] = authHeader.split(' ');
      if (authType.toLowerCase() !== 'basic') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const [email, password] = Buffer.from(authBase64, 'base64')
        .toString()
        .split(':');

      // Find the user associated with the email and hashed password
      const hashedPassword = sha1(password);
      const user = await User.findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a random token using uuidv4
      const token = uuidv4();

      // Create a key for storing in Redis
      const redisKey = `auth_${token}`;

      // Store the user ID in Redis with the generated token for 24 hours
      await redisClient.setex(redisKey, 24 * 60 * 60, user._id.toString());

      // Return the token in the response
      return res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // Endpoint for user sign-out and token revocation
  disconnect: async (req, res) => {
    try {
      // Extract the token from the X-Token header
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user ID from Redis based on the token
      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis
      await redisClient.del(redisKey);

      // Respond with a 204 status code (no content) to indicate successful sign-out
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default AuthController;
