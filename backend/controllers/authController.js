import User from "../models/userModel.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
    const access_token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET,{ 
        expiresIn: "15m" 
    });
    const refresh_token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { 
        expiresIn: "7d" 
    });

    return { access_token, refresh_token };
};

const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7days
};

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const UserExists = await User.findOne({ email });

    if(UserExists) {
        return res.status(400).json({ msg: "User already exists"});
    }

    const user = await User.create({ name, email, password });

    const {access_token, refresh_token} = generateTokens(user._id);

    res.status(201).json({ user, message: "User created successfully"});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    res.send("Sign up route called");
};

export const logout = async (req, res) => {
    res.send("Sign up route called");
};