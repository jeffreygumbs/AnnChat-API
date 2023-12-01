"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importStar(require("bcrypt"));
const stream_chat_1 = require("stream-chat");
const prisma_1 = __importDefault(require("../data/prisma"));
dotenv_1.default.config();
const { PORT, STREAM_API_KEY, STREAM_API_SECRET } = process.env;
const client = stream_chat_1.StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
const app = (0, express_1.default)();
app.use(express_1.default.json());
const salt = (0, bcrypt_1.genSaltSync)(10);
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const USERS = yield prisma_1.default.user.findMany();
    // errer management for register section start
    if (!email || !password)
        return res.status(400).json({ message: "Missing email or password" });
    if (password.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    const existsUser = USERS.find((user) => user.email === email);
    if (existsUser)
        return res.status(400).json({ message: "User already exists" });
    // errer management for register section end
    try {
        const NEWUSERS = yield prisma_1.default.user.create({
            data: {
                email,
                hashed_password: (0, bcrypt_1.hashSync)(password, salt)
            },
        });
        yield client.upsertUser({
            id: NEWUSERS.id,
            email,
            name: email,
        });
        const token = client.createToken(NEWUSERS.id);
        return res.status(200).json({ token, user: { id: NEWUSERS.id, email } });
    }
    catch (error) {
        res.status(500).json({ error: 'User already exists' });
    }
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const USERS = yield prisma_1.default.user.findMany();
    const user = USERS.find((user) => user.email === email);
    const hashed_password = (0, bcrypt_1.hashSync)(password, salt);
    if (!user || !bcrypt_1.default.compareSync(password, user.hashed_password))
        return res.status(400).json({ message: "Incorrect email or password" });
    const token = client.createToken(user.id);
    return res.status(200).json({ token, user: { id: user.id, email: user.email } });
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map