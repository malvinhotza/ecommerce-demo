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

const setCookies = (res, access_token, refresh_token) => {
    res.cookie("accessToken", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const UserExists = await User.findOne({ email });

    if(UserExists) {
        return res.status(400).json({ msg: "User already exists"});
    }

    const user = await User.create({ name, email, password });

    const {access_token, refresh_token} = generateTokens(user._id);
    await storeRefreshToken(user._id, refresh_token);
    setCookies(res, access_token, refresh_token);

    res.status(201).json({ 
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }, message: "User created successfully"});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    res.send("Sign up route called");
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        console.log(refreshToken);
        if(refreshToken) {
            console.log(refreshToken);
            const decoded = jwt.verify(refreshToken, process.env.ACCESS_TOKEN_SECRET);
            console.log(decoded);
            await redis.del(`refresh_token:${decoded.userId}`);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
    }
};