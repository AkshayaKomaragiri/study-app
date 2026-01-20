import jwt from 'jsonwebtoken'
import { prisma } from '../index.mjs';

export const authentication = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token");

        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // app/server/middlewares/auth.mjs
try {
    const decode = jwt.verify(token, 'JWT_SECRET')
    console.log(decode);
    console.log(decode.email);
    const user = await prisma.user.findUnique({
        where: { email: decode.email },
    });
    
    if (!user) {
        console.log("User not found in database" );
        return res.status(401).json({ error: "User not found in database" });
        
    }

    req.user = user;
    next();
} catch (err) {
    // This will tell you if the token is expired or the secret is wrong
    console.log("Invalid Token" );
    return res.status(401).json({ error: "Invalid token", details: err.message });
}
}