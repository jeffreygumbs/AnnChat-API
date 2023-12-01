import express from "express";
import dotenv from "dotenv";
import bcrypt, { genSaltSync, hashSync } from "bcrypt";
import { StreamChat } from "stream-chat";
import prisma from "../data/prisma";


dotenv.config();

const { PORT, STREAM_API_KEY, STREAM_API_SECRET } = process.env;
const client = StreamChat.getInstance(STREAM_API_KEY!, STREAM_API_SECRET);

const app = express();
app.use(express.json());
const salt = genSaltSync(10);

interface User {
    id: string;
    email: string;
    name: string | null; // Allow name to be null
    hashed_password: string;
    createdAt: Date;
    updatedAt: Date;
}


app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const USERS: User[] = await prisma.user.findMany();
    
    // errer management for register section start
    if(!email || !password) return res.status(400).json({ message: "Missing email or password" });
    if(password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const existsUser = USERS.find((user) => user.email === email);
    if(existsUser) return res.status(400).json({ message: "User already exists" });
    // errer management for register section end

    try{
        const NEWUSERS: User = await prisma.user.create({
            data: {
                email,
                hashed_password: hashSync(password, salt)
            },
        });

        await client.upsertUser({
            id: NEWUSERS.id,
            email,
            name: email,
        });
        const token = client.createToken(NEWUSERS.id);
        return res.status(200).json({ token, user: {id: NEWUSERS.id, email} });
        
    } catch (error) {
        res.status(500).json({ error: 'User already exists' });
    }
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const USERS: User[] = await prisma.user.findMany();
    const user = USERS.find((user) => user.email === email);
    const hashed_password = hashSync(password, salt);
    if(!user || !bcrypt.compareSync(password, user.hashed_password)) return res.status(400).json({ message: "Incorrect email or password" });
    const token = client.createToken(user.id);
    return res.status(200).json({ token, user: {id: user.id, email: user.email} });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});